<?php

namespace app\models;

use yii\db\ActiveRecord;

/**
 * TiangListrik Model
 *
 * @property int $id
 * @property string $kode_aset
 * @property string $nomor_seri
 * @property string $jenis
 * @property string $material
 * @property string $tinggi
 * @property int $tahun_pasang
 * @property string $wilayah
 * @property string $rayon
 * @property string $penyulang
 * @property string $gardu_induk
 * @property float $latitude
 * @property float $longitude
 * @property string $alamat
 * @property string $kondisi
 * @property string $tegangan_operasional
 * @property float $beban_arus_ampere
 * @property float $kapasitas_maks_ampere
 * @property float $suhu_operasional_celsius
 * @property float $kemiringan_derajat
 * @property float $jarak_vegetasi_meter
 * @property int $indeks_korosi_persen
 * @property int $skor_risiko_prediktif
 * @property string $rekomendasi_tindakan
 * @property string $qr_code_data
 * @property string $terakhir_inspeksi
 * @property string $jadwal_inspeksi_berikutnya
 */
class TiangListrik extends ActiveRecord
{
    public static function tableName()
    {
        return '{{%tiang_listrik}}';
    }

    public function rules()
    {
        return [
            [['kode_aset', 'nomor_seri', 'wilayah', 'latitude', 'longitude', 'alamat'], 'required'],
            [['tahun_pasang', 'indeks_korosi_persen', 'skor_risiko_prediktif'], 'integer'],
            [['latitude', 'longitude', 'beban_arus_ampere', 'kapasitas_maks_ampere', 'suhu_operasional_celsius', 'kemiringan_derajat', 'jarak_vegetasi_meter'], 'number'],
            [['alamat', 'rekomendasi_tindakan'], 'string'],
            [['terakhir_inspeksi', 'jadwal_inspeksi_berikutnya', 'created_at', 'updated_at'], 'safe'],
            [['kode_aset', 'nomor_seri', 'penyulang', 'gardu_induk'], 'string', 'max' => 100],
            [['qr_code_data'], 'string', 'max' => 255],
            [['kode_aset', 'qr_code_data'], 'unique'],
        ];
    }

    public function getRiwayatPerbaikans()
    {
        return $this->hasMany(RiwayatAuditPerbaikan::class, ['tiang_id' => 'id'])->orderBy(['waktu_audit' => SORT_DESC]);
    }

    public function getLaporanKerusakans()
    {
        return $this->hasMany(LaporanKerusakan::class, ['tiang_id' => 'id'])->orderBy(['waktu_lapor' => SORT_DESC]);
    }
}
