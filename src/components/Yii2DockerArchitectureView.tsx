import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  Terminal, 
  Copy, 
  Check, 
  Layers, 
  Code2, 
  Play, 
  ExternalLink,
  Cpu,
  Boxes
} from 'lucide-react';

const DOCKER_COMPOSE_SNIPPET = `version: '3.8'

services:
  # Nginx Web Server Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: voltgrid-nginx
    restart: always
    ports:
      - "8080:80"
    volumes:
      - ./:/var/www/voltgrid
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - php-fpm
      - mysql
    networks:
      - voltgrid-network

  # Yii2 Backend PHP 8.2-FPM Container
  php-fpm:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: voltgrid-yii2-app
    restart: always
    environment:
      YII_ENV: dev
      YII_DEBUG: "true"
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: voltgrid_db
      DB_USER: voltgrid_user
      DB_PASS: voltgrid_secret_pass
      REDIS_HOST: redis
      REDIS_PORT: 6379
    volumes:
      - ./:/var/www/voltgrid
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - voltgrid-network

  # MySQL 8.0 Primary Relational Database
  mysql:
    image: mysql:8.0
    container_name: voltgrid-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_secure_pass_2026
      MYSQL_DATABASE: voltgrid_db
      MYSQL_USER: voltgrid_user
      MYSQL_PASSWORD: voltgrid_secret_pass
    ports:
      - "3307:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - voltgrid-network

  # Redis for Push Notification Queue & Weather Cache
  redis:
    image: redis:7-alpine
    container_name: voltgrid-redis
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data
    networks:
      - voltgrid-network

networks:
  voltgrid-network:
    driver: bridge

volumes:
  mysql_data:
  redis_data:`;

const YII2_CONTROLLER_SNIPPET = `<?php

namespace app\\controllers;

use Yii;
use yii\\rest\\ActiveController;
use yii\\web\\Response;
use yii\\web\\NotFoundHttpException;
use yii\\filters\\Cors;

/**
 * TiangListrikController implements RESTful API for TiangListrik model
 * Integrated with Real-Time Push Notification and Predictive Risk Analysis
 */
class TiangListrikController extends ActiveController
{
    public $modelClass = 'app\\models\\TiangListrik';

    public function behaviors()
    {
        $behaviors = parent::behaviors();
        $behaviors['contentNegotiator']['formats']['text/html'] = Response::FORMAT_JSON;
        $behaviors['corsFilter'] = [
            'class' => Cors::class,
            'cors' => [
                'Origin' => ['*'],
                'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
                'Access-Control-Request-Headers' => ['*'],
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
        $pole = \\app\\models\\TiangListrik::find()
            ->where(['qr_code_data' => $code])
            ->orWhere(['kode_aset' => $code])
            ->with(['riwayatPerbaikans', 'laporanKerusakans'])
            ->asArray()
            ->one();

        if (!$pole) {
            throw new NotFoundHttpException("Tiang listrik '{$code}' tidak ditemukan.");
        }

        return [
            'success' => true,
            'data' => $pole,
            'message' => 'Spesifikasi tiang & riwayat audit berhasil dimuat.',
        ];
    }

    /**
     * POST /api/tiang-listrik/predictive-risk/{id}
     * Computes real-time failure risk score using weather & sensor telemetry
     */
    public function actionPredictiveRisk($id)
    {
        $pole = \\app\\models\\TiangListrik::findOne($id);
        // Multi-parameter weighted algorithm
        $tiltRisk = min(100, ($pole->kemiringan_derajat / 8.5) * 100);
        $loadRatio = $pole->beban_arus_ampere / max(1, $pole->kapasitas_maks_ampere);
        $thermalRisk = min(100, ($loadRatio * 60) + max(0, $pole->suhu_operasional_celsius - 40) * 1.5);
        $vegRisk = $pole->jarak_vegetasi_meter < 1.0 ? 95 : ($pole->jarak_vegetasi_meter < 2.0 ? 65 : 15);
        $corrosionRisk = min(100, ((2026 - $pole->tahun_pasang) * 2) + ($pole->indeks_korosi_persen * 0.6));

        $compositeScore = round($tiltRisk * 0.28 + $thermalRisk * 0.24 + $vegRisk * 0.18 + $corrosionRisk * 0.16 + 20 * 0.14);
        $pole->skor_risiko_prediktif = $compositeScore;
        $pole->save(false);

        return [
            'success' => true,
            'kode_aset' => $pole->kode_aset,
            'composite_risk_score' => $compositeScore,
            'category' => $compositeScore >= 80 ? 'Kritis' : ($compositeScore >= 60 ? 'Tinggi' : 'Normal'),
        ];
    }
}`;

const MYSQL_MIGRATION_SNIPPET = `<?php

use yii\\db\\Migration;

class m240301_000001_create_tiang_listrik_and_kerusakan_tables extends Migration
{
    public function safeUp()
    {
        $tableOptions = 'CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB';

        // 1. Table tiang_listrik
        $this->createTable('{{%tiang_listrik}}', [
            'id' => $this->primaryKey(),
            'kode_aset' => $this->string(64)->notNull()->unique(),
            'nomor_seri' => $this->string(100)->notNull(),
            'jenis' => "ENUM('JTM 20kV', 'JTR 380V/220V', 'Gardu Tiang Trafo (GTT)', 'Tiang Penegang/Corner') NOT NULL",
            'material' => "ENUM('Beton Pratekan', 'Baja Tubular', 'Kayu Ulin') NOT NULL DEFAULT 'Beton Pratekan'",
            'tinggi' => "ENUM('9m', '11m', '12m', '14m') NOT NULL DEFAULT '12m'",
            'tahun_pasang' => $this->smallInteger()->notNull(),
            'wilayah' => $this->string(100)->notNull(),
            'penyulang' => $this->string(100)->notNull(),
            'gardu_induk' => $this->string(100)->notNull(),
            'latitude' => $this->decimal(10, 8)->notNull(),
            'longitude' => $this->decimal(11, 8)->notNull(),
            'alamat' => $this->text()->notNull(),
            'kondisi' => "ENUM('normal', 'waspada', 'kritis', 'dalam_perbaikan') NOT NULL DEFAULT 'normal'",
            'beban_arus_ampere' => $this->float()->notNull()->defaultValue(0),
            'suhu_operasional_celsius' => $this->float()->notNull()->defaultValue(35.0),
            'kemiringan_derajat' => $this->float()->notNull()->defaultValue(0.0),
            'jarak_vegetasi_meter' => $this->float()->notNull()->defaultValue(3.0),
            'indeks_korosi_persen' => $this->tinyInteger()->notNull()->defaultValue(0),
            'skor_risiko_prediktif' => $this->tinyInteger()->notNull()->defaultValue(10),
            'qr_code_data' => $this->string(255)->notNull()->unique(),
            'terakhir_inspeksi' => $this->dateTime()->null(),
        ], $tableOptions);

        $this->createIndex('idx_tiang_lat_lng', '{{%tiang_listrik}}', ['latitude', 'longitude']);
        $this->createIndex('idx_tiang_kondisi', '{{%tiang_listrik}}', 'kondisi');
    }
}`;

export const Yii2DockerArchitectureView: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'docker' | 'yii2' | 'mysql' | 'sandbox'>('docker');
  const [copied, setCopied] = useState<boolean>(false);

  // API Sandbox State
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /api/tiang-listrik/scan-qr?code=PLN-TL-BDG-014-JTM-20KV-2021');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isExecutingApi, setIsExecutingApi] = useState<boolean>(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExecuteSandbox = () => {
    setIsExecutingApi(true);
    setTimeout(() => {
      if (selectedEndpoint.includes('scan-qr')) {
        setApiResponse(JSON.stringify({
          status: 200,
          framework: 'Yii2 Advanced Framework v2.0.49',
          server: 'nginx/1.25.3 (voltgrid-nginx)',
          database: 'MySQL 8.0.35 InnoDB (voltgrid_db)',
          responseTime: '18ms',
          data: {
            id: 1,
            kode_aset: 'TL-BDG-014',
            jenis: 'JTM 20kV',
            material: 'Beton Pratekan',
            wilayah: 'Bandung Timur',
            penyulang: 'Penyulang Cipadung (F-CPD02)',
            kondisi: 'normal',
            skor_risiko_prediktif: 14,
            qr_code_data: 'PLN-TL-BDG-014-JTM-20KV-2021',
            riwayat_perbaikan_count: 1
          }
        }, null, 2));
      } else if (selectedEndpoint.includes('predictive-risk')) {
        setApiResponse(JSON.stringify({
          status: 200,
          framework: 'Yii2 RESTful Engine',
          executionTime: '24ms',
          composite_risk_score: 88,
          category: 'Kritis',
          factors: {
            tilt_risk: 91.8,
            thermal_risk: 86.4,
            vegetation_risk: 85.0,
            corrosion_risk: 54.0
          },
          rekomendasi: 'BAHAYA TINGGI: Beban trafo mendekati 95%, suhu bushing kritis >70°C, dan kemiringan pondasi 7.8°.'
        }, null, 2));
      } else {
        setApiResponse(JSON.stringify({
          status: 200,
          sql: "SELECT * FROM tiang_listrik WHERE kondisi='kritis' ORDER BY skor_risiko_prediktif DESC",
          rowsFound: 2,
          executionPlan: "Index Scan using idx_tiang_kondisi (cost=0.15..8.17 rows=2)",
          results: [
            { kode_aset: 'TL-BDG-078', kemiringan: 8.9, skor_risiko: 92, status: 'kritis' },
            { kode_aset: 'TL-BDG-028', kemiringan: 7.8, skor_risiko: 88, status: 'kritis' }
          ]
        }, null, 2));
      }
      setIsExecutingApi(false);
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-white">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Server className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Arsitektur Yii2 Framework, MySQL 8.0 & Containerisasi Docker
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Sistem backend monolitik & REST API berbasis Yii2 Framework dengan MySQL Relational Database, Nginx Reverse Proxy, Redis event bus, dan file konfigurasi Docker siap produksi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-700 text-amber-400">
            PHP 8.2-FPM · MySQL 8 · Yii2
          </span>
        </div>
      </div>

      {/* Architecture Topology Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Boxes className="w-4 h-4" />
            <span>Nginx Reverse Proxy</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Menangani TLS SSL termination, gzip compression, routing Pretty URL Yii2, dan static asset caching.
          </p>
          <span className="font-mono text-[10px] text-slate-500 block">Port: 8080:80</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <Cpu className="w-4 h-4" />
            <span>Yii2 REST Engine</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            PHP 8.2-FPM ActiveController dengan CORS, Bearer Token Auth, Active Record ORM, dan modul prediktif.
          </p>
          <span className="font-mono text-[10px] text-slate-500 block">Service: php-fpm:9000</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <Database className="w-4 h-4" />
            <span>MySQL 8.0 InnoDB</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Relational schema dengan foreign keys, ENUM status, spatial coordinates index, dan JSON storage untuk audit.
          </p>
          <span className="font-mono text-[10px] text-slate-500 block">Port: 3307:3306</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <Terminal className="w-4 h-4" />
            <span>Redis Event Bus</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Message broker untuk push notification real-time dispatch teknisi lapangan dan caching cuaca BMKG.
          </p>
          <span className="font-mono text-[10px] text-slate-500 block">Port: 6380:6379</span>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Sub Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-850 px-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveCodeTab('docker')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeCodeTab === 'docker' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              docker-compose.yml
            </button>
            <button
              onClick={() => setActiveCodeTab('yii2')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeCodeTab === 'yii2' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              TiangListrikController.php
            </button>
            <button
              onClick={() => setActiveCodeTab('mysql')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeCodeTab === 'mysql' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Migration & Schema MySQL
            </button>
            <button
              onClick={() => setActiveCodeTab('sandbox')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeCodeTab === 'sandbox' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulasi Yii2 REST API Sandbox</span>
            </button>
          </div>

          {activeCodeTab !== 'sandbox' && (
            <button
              onClick={() => {
                const code = activeCodeTab === 'docker' ? DOCKER_COMPOSE_SNIPPET : activeCodeTab === 'yii2' ? YII2_CONTROLLER_SNIPPET : MYSQL_MIGRATION_SNIPPET;
                handleCopy(code);
              }}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-amber-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>
          )}
        </div>

        {/* Code Output / Sandbox Body */}
        <div className="p-4 sm:p-6 bg-slate-950 font-mono text-xs overflow-x-auto">
          {activeCodeTab === 'docker' && (
            <pre className="text-slate-300 leading-relaxed">
              <code>{DOCKER_COMPOSE_SNIPPET}</code>
            </pre>
          )}

          {activeCodeTab === 'yii2' && (
            <pre className="text-slate-300 leading-relaxed">
              <code>{YII2_CONTROLLER_SNIPPET}</code>
            </pre>
          )}

          {activeCodeTab === 'mysql' && (
            <pre className="text-slate-300 leading-relaxed">
              <code>{MYSQL_MIGRATION_SNIPPET}</code>
            </pre>
          )}

          {activeCodeTab === 'sandbox' && (
            <div className="space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                >
                  <option value="GET /api/tiang-listrik/scan-qr?code=PLN-TL-BDG-014-JTM-20KV-2021">
                    GET /api/tiang-listrik/scan-qr?code=PLN-TL-BDG-014-JTM-20KV-2021
                  </option>
                  <option value="POST /api/tiang-listrik/predictive-risk/pole-002">
                    POST /api/tiang-listrik/predictive-risk/pole-002 (Kalkulasi Kegagalan)
                  </option>
                  <option value="SQL_QUERY_KRITIS">
                    SQL QUERY: SELECT * FROM tiang_listrik WHERE kondisi='kritis'
                  </option>
                </select>

                <button
                  onClick={handleExecuteSandbox}
                  disabled={isExecutingApi}
                  className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isExecutingApi ? 'Memproses Endpoint...' : 'Kirim Request'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-sans">
                  Respon JSON dari Yii2 ActiveController:
                </span>
                <pre className="text-emerald-400 font-mono text-xs overflow-x-auto p-3 bg-slate-950 rounded-lg">
                  <code>{apiResponse || '// Tekan tombol "Kirim Request" di atas untuk menguji coba eksekusi REST API Yii2.'}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
