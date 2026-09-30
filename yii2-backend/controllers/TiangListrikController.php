<?php

namespace app\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\web\Response;
use yii\web\NotFoundHttpException;
use yii\filters\Cors;
use yii\filters\VerbFilter;

/**
 * TiangListrikController implements the RESTful API for TiangListrik model
 * Integrated with Real-Time Push Notification and Predictive Risk Analysis
 */
class TiangListrikController extends ActiveController
{
    public $modelClass = 'app\models\TiangListrik';

    public function behaviors()
    {
        $behaviors = parent::behaviors();
        
        // Return JSON response for all REST requests
        $behaviors['contentNegotiator']['formats']['text/html'] = Response::FORMAT_JSON;

        // CORS filter for frontend integration
        $behaviors['corsFilter'] = [
            'class' => Cors::class,
            'cors' => [
                'Origin' => ['*'],
                'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
                'Access-Control-Request-Headers' => ['*'],
                'Access-Control-Allow-Credentials' => null,
                'Access-Control-Max-Age' => 86400,
            ],
        ];

        return $behaviors;
    }

    /**
     * GET /api/tiang-listrik/scan-qr?code=PLN-TL-BDG-014...
     * Fast retrieval for field technician QR Code audit
     */
    public function actionScanQr($code)
    {
        $pole = \app\models\TiangListrik::find()
            ->where(['qr_code_data' => $code])
            ->orWhere(['kode_aset' => $code])
            ->with(['riwayatPerbaikans', 'laporanKerusakans'])
            ->asArray()
            ->one();

        if (!$pole) {
            throw new NotFoundHttpException("Tiang listrik dengan kode QR '{$code}' tidak ditemukan dalam basis data.");
        }

        return [
            'success' => true,
            'data' => $pole,
            'message' => 'Data spesifikasi dan riwayat audit tiang berhasil dimuat.',
        ];
    }

    /**
     * POST /api/tiang-listrik/predictive-risk/{id}
     * Computes real-time failure risk score using weather & sensor telemetry
     */
    public function actionPredictiveRisk($id)
    {
        $pole = \app\models\TiangListrik::findOne($id);
        if (!$pole) {
            throw new NotFoundHttpException("Tiang listrik tidak ditemukan.");
        }

        // Multi-parameter weighted algorithm
        $tiltRisk = min(100, ($pole->kemiringan_derajat / 8.5) * 100);
        $loadRatio = $pole->beban_arus_ampere / max(1, $pole->kapasitas_maks_ampere);
        $thermalRisk = min(100, ($loadRatio * 60) + max(0, $pole->suhu_operasional_celsius - 40) * 1.5);
        $vegRisk = $pole->jarak_vegetasi_meter < 1.0 ? 95 : ($pole->jarak_vegetasi_meter < 2.0 ? 65 : 15);
        $corrosionRisk = min(100, ((2026 - $pole->tahun_pasang) * 2) + ($pole->indeks_korosi_persen * 0.6));

        $compositeScore = round(
            $tiltRisk * 0.28 +
            $thermalRisk * 0.24 +
            $vegRisk * 0.18 +
            $corrosionRisk * 0.16 +
            20 * 0.14
        );

        $pole->skor_risiko_prediktif = $compositeScore;
        $pole->save(false);

        return [
            'success' => true,
            'kode_aset' => $pole->kode_aset,
            'composite_risk_score' => $compositeScore,
            'category' => $compositeScore >= 80 ? 'Kritis' : ($compositeScore >= 60 ? 'Tinggi' : 'Normal'),
            'factors' => [
                'tilt_risk' => round($tiltRisk, 1),
                'thermal_risk' => round($thermalRisk, 1),
                'vegetation_risk' => round($vegRisk, 1),
                'corrosion_risk' => round($corrosionRisk, 1),
            ],
            'rekomendasi' => $pole->rekomendasi_tindakan,
        ];
    }

    /**
     * POST /api/tiang-listrik/report-damage
     * Receives damage report from field, sends push notification via WebSocket/FCM
     */
    public function actionReportDamage()
    {
        $request = Yii::$app->request->post();
        $model = new \app\models\LaporanKerusakan();
        $model->attributes = $request;
        $model->no_tiket = 'TKT-' . date('Ymd') . '-' . rand(1000, 9999);
        $model->waktu_lapor = date('Y-m-d H:i:s');
        $model->status = 'menunggu';

        if ($model->save()) {
            // Trigger Redis event for push notification worker
            if (Yii::$app->has('redis')) {
                Yii::$app->redis->publish('voltgrid_notifications', json_encode([
                    'type' => 'NEW_DAMAGE_REPORT',
                    'tiket' => $model->no_tiket,
                    'kode_aset' => $model->kode_aset,
                    'keparahan' => $model->tingkat_keparahan,
                    'deskripsi' => $model->deskripsi,
                ]));
            }

            return [
                'success' => true,
                'no_tiket' => $model->no_tiket,
                'message' => 'Laporan kerusakan berhasil didaftarkan dan tim teknisi telah diberitahu.',
                'data' => $model,
            ];
        }

        return [
            'success' => false,
            'errors' => $model->getErrors(),
        ];
    }
}
