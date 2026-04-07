const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbxOzqMRYIZXZ-Nvtl3UiR9H9BeDA0SAvLGA7vVTCm_V5J82eoOzMNV3cNv-7UBa8s6NYA/exec";

// 1. Fungsi Ambil Data & Update Saldo Utama
async function muatData() {
    const tbody = document.getElementById('isiTabel');
    const displaySaldoAtas = document.getElementById('totalSaldoAtas');

    try {
        const res = await fetch(URL_WEB_APP);
        const data = await res.json();
        tbody.innerHTML = "";

        if (data.length === 0) {
            tbody.innerHTML = "<tr><td colspan='8' style='text-align:center'>Belum ada transaksi.</td></tr>";
            displaySaldoAtas.innerText = "Rp 0";
            return;
        }

        // Ambil saldo terakhir dari baris paling bawah untuk kartu di atas
        // Gunakan replace untuk membersihkan karakter non-angka jika ada format Rp
        const saldoMentah = data[data.length - 1].SaldoAkhir.toString().replace(/[^0-9.-]+/g,"");
        displaySaldoAtas.innerText = "Rp " + Number(saldoMentah).toLocaleString('id-ID');

        // Tampilkan tabel (Data terbaru di posisi atas)
        data.reverse().forEach(row => {
            // Karena menggunakan getDisplayValues, angka mungkin datang sebagai teks "10.000"
            // Kita bersihkan dulu agar bisa diformat ulang oleh JS
            const cleanMasuk = row.SaldoMasuk.toString().replace(/[^0-9.-]+/g,"");
            const cleanKeluar = row.SaldoKeluar.toString().replace(/[^0-9.-]+/g,"");
            const cleanAkhir = row.SaldoAkhir.toString().replace(/[^0-9.-]+/g,"");

            const formatUang = (val) => {
                const num = Number(val);
                return num > 0 ? "Rp " + num.toLocaleString('id-ID') : "-";
            };

            tbody.innerHTML += `
                <tr>
                    <td>${row.No}</td>
                    <td>${row.Tanggal}</td>
                    <td>${row.Waktu}</td>
                    <td>${row.Keterangan}</td>
                    <td class="pemasukan">${formatUang(cleanMasuk)}</td>
                    <td class="pengeluaran">${formatUang(cleanKeluar)}</td>
                    <td><span class="saldo-val">Rp ${Number(cleanAkhir).toLocaleString('id-ID')}</span></td>
                    <td>
                        <button class="btn-hapus" onclick="hapusData(${row.No})">Hapus</button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        tbody.innerHTML = "<tr><td colspan='8' style='text-align:center; color:red'>Error memuat database.</td></tr>";
    }
}

// 2. Fungsi Simpan Data
async function simpanKeScript() {
    const btn = document.getElementById('btnSimpan');
    const ket = document.getElementById('ket').value;
    const kat = document.getElementById('kat').value;
    const nom = document.getElementById('nom').value;

    if (!ket || !nom) return alert("Mohon lengkapi keterangan dan nominal!");

    btn.disabled = true;
    btn.innerText = "Menyimpan...";

    try {
        await fetch(URL_WEB_APP, {
            method: 'POST',
            body: JSON.stringify({ keterangan: ket, kategori: kat, nominal: nom })
        });
        
        document.getElementById('ket').value = "";
        document.getElementById('nom').value = "";
        muatData();
    } catch (e) {
        alert("Gagal menyimpan data.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Simpan";
    }
}

// 3. Fungsi Hapus Data
async function hapusData(noId) {
    if (!confirm("Hapus transaksi nomor " + noId + "?")) return;
    
    try {
        await fetch(URL_WEB_APP, {
            method: 'POST',
            body: JSON.stringify({ aksi: 'hapus', id: noId })
        });
        muatData();
    } catch (e) {
        alert("Gagal menghapus data.");
    }
}

// Jalankan saat pertama kali dibuka
muatData();