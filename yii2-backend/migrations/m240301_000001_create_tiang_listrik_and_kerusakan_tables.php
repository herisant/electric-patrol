<?php

use yii\db\Migration;

/**
 * Migration for VoltGrid Pole Monitoring System
 * Handles creation of tables: tiang_listrik, laporan_kerusakan, riwayat_audit, notifikasi_push
 */
class m240301_000001_create_tiang_listrik_and_kerusakan_tables extends Migration
{
    public function safeUp()
    {
        $tableOptions = null;
        if ($this->db->driverName === 'mysql') {
            $tableOptions = 'CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB';
        }

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
            'rayon' => $this->string(100)->notNull(),
            'penyulang' => $this->string(100)->notNull(),
            'gardu_induk' => $this->string(100)->notNull(),
            'latitude' => $this->decimal(10, 8)->notNull(),
            'longitude' => $this->decimal(11, 8)->notNull(),
            'alamat' => $this->text()->notNull(),
            'kondisi' => "ENUM('normal', 'waspada', 'kritis', 'dalam_perbaikan') NOT NULL DEFAULT 'normal'",
            'tegangan_operasional' => $this->string(32)->notNull()->defaultValue('20 kV'),
            'beban_arus_ampere' => $this->float()->notNull()->defaultValue(0),
            'kapasitas_maks_ampere' => $this->float()->notNull()->defaultValue(250),
            'suhu_operasional_celsius' => $this->float()->notNull()->defaultValue(35.0),
            'kemiringan_derajat' => $this->float()->notNull()->defaultValue(0.0),
            'jarak_vegetasi_meter' => $this->float()->notNull()->defaultValue(3.0),
            'indeks_korosi_persen' => $this->tinyInteger()->notNull()->defaultValue(0),
            'skor_risiko_prediktif' => $this->tinyInteger()->notNull()->defaultValue(10),
            'rekomendasi_tindakan' => $this->text()->null(),
            'qr_code_data' => $this->string(255)->notNull()->unique(),
            'terakhir_inspeksi' => $this->dateTime()->null(),
            'jadwal_inspeksi_berikutnya' => $this->date()->null(),
            'created_at' => $this->timestamp()->defaultExpression('CURRENT_TIMESTAMP'),
            'updated_at' => $this->timestamp()->defaultExpression('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        ], $tableOptions);

        $this->createIndex('idx_tiang_kode_aset', '{{%tiang_listrik}}', 'kode_aset');
        $this->createIndex('idx_tiang_kondisi', '{{%tiang_listrik}}', 'kondisi');
        $this->createIndex('idx_tiang_lat_lng', '{{%tiang_listrik}}', ['latitude', 'longitude']);
        $this->createIndex('idx_tiang_penyulang', '{{%tiang_listrik}}', 'penyulang');

        // 2. Table laporan_kerusakan
        $this->createTable('{{%laporan_kerusakan}}', [
            'id' => $this->primaryKey(),
            'no_tiket' => $this->string(32)->notNull()->unique(),
            'tiang_id' => $this->integer()->notNull(),
            'kode_aset' => $this->string(64)->notNull(),
            'jenis_kerusakan' => "ENUM('tiang_miring', 'isolator_pecah', 'trafo_bocor_meledak', 'kabel_putus_andongan', 'terhalang_pohon', 'korsleting_percikan', 'korosi_pondasi_amblas') NOT NULL",
            'tingkat_keparahan' => "ENUM('rendah', 'sedang', 'tinggi', 'darurat') NOT NULL DEFAULT 'sedang'",
            'deskripsi' => $this->text()->notNull(),
            'foto_url' => $this->string(500)->null(),
            'pelapor_nama' => $this->string(100)->notNull(),
            'pelapor_telepon' => $this->string(30)->notNull(),
            'pelapor_tipe' => "ENUM('teknisi', 'petugas_patroli', 'masyarakat') NOT NULL DEFAULT 'petugas_patroli'",
            'latitude' => $this->decimal(10, 8)->notNull(),
            'longitude' => $this->decimal(11, 8)->notNull(),
            'alamat' => $this->text()->notNull(),
            'status' => "ENUM('menunggu', 'ditugaskan', 'menuju_lokasi', 'dalam_perbaikan', 'uji_coba', 'selesai') NOT NULL DEFAULT 'menunggu'",
            'tim_teknisi' => $this->string(150)->null(),
            'estimasi_pengerjaan_jam' => $this->float()->notNull()->defaultValue(2.0),
            'waktu_lapor' => $this->dateTime()->notNull(),
            'waktu_ditugaskan' => $this->dateTime()->null(),
            'waktu_mulai_perbaikan' => $this->dateTime()->null(),
            'waktu_selesai' => $this->dateTime()->null(),
            'catatan_perbaikan' => $this->text()->null(),
            'material_digunakan' => $this->json()->null(),
            'created_at' => $this->timestamp()->defaultExpression('CURRENT_TIMESTAMP'),
            'updated_at' => $this->timestamp()->defaultExpression('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        ], $tableOptions);

        $this->createIndex('idx_laporan_no_tiket', '{{%laporan_kerusakan}}', 'no_tiket');
        $this->createIndex('idx_laporan_status', '{{%laporan_kerusakan}}', 'status');
        $this->addForeignKey('fk_laporan_tiang', '{{%laporan_kerusakan}}', 'tiang_id', '{{%tiang_listrik}}', 'id', 'CASCADE', 'CASCADE');

        // 3. Table riwayat_audit_perbaikan
        $this->createTable('{{%riwayat_audit_perbaikan}}', [
            'id' => $this->primaryKey(),
            'tiang_id' => $this->integer()->notNull(),
            'no_perintah_kerja' => $this->string(64)->notNull(),
            'teknisi' => $this->string(150)->notNull(),
            'tindakan' => $this->text()->notNull(),
            'pergantian_komponen' => $this->json()->null(),
            'catatan_audit' => $this->text()->notNull(),
            'foto_url' => $this->string(500)->null(),
            'status_akhir' => "ENUM('Selesai Baik', 'Perlu Pantauan', 'Rekomendasi Rekonfigurasi') NOT NULL DEFAULT 'Selesai Baik'",
            'waktu_audit' => $this->dateTime()->notNull(),
            'created_at' => $this->timestamp()->defaultExpression('CURRENT_TIMESTAMP'),
        ], $tableOptions);

        $this->addForeignKey('fk_audit_tiang', '{{%riwayat_audit_perbaikan}}', 'tiang_id', '{{%tiang_listrik}}', 'id', 'CASCADE', 'CASCADE');
    }

    public function safeDown()
    {
        $this->dropTable('{{%riwayat_audit_perbaikan}}');
        $this->dropTable('{{%laporan_kerusakan}}');
        $this->dropTable('{{%tiang_listrik}}');
    }
}
