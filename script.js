const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbw0TGXVjqeZw1GsthHXQa_f-nep-55729MzdyudaxWkAhrWQDcWUGosg6lgJUjWDPhF/exec";
let isEditing = false;
let editId = null;

async function muatData() {
    const tbody = document.getElementById('isiTabel');
    const displaySaldoAtas = document.getElementById('totalSaldoAtas');
    try {
        const res = await fetch(URL_WEB_APP);
        const data = await res.json();
        tbody.innerHTML = "";

        if (data.length === 0) {
            displaySaldoAtas.innerText = "Rp 0";
            tbody.innerHTML = "<tr><td colspan='8' style='text-align:center'>Belum ada data.</td></tr>";
            return;
        }

        const saldoTerakhir = data[data.length - 1].SaldoAkhir.toString().replace(/[^0-9.-]+/g,"");
        displaySaldoAtas.innerText = "Rp " + Number(saldoTerakhir).toLocaleString('id-ID');

        data.reverse().forEach(row => {
            const cleanMasuk = row.SaldoMasuk.toString().replace(/[^0-9.-]+/g,"");
            const cleanKeluar = row.SaldoKeluar.toString().replace(/[^0-9.-]+/g,"");
            const cleanAkhir = row.SaldoAkhir.toString().replace(/[^0-9.-]+/g,"");
            const nominalAsli = Number(cleanMasuk) > 0 ? Number(cleanMasuk) : Number(cleanKeluar);

            tbody.innerHTML += `
                <tr>
                    <td>${row.No}</td>
                    <td>${row.Tanggal}</td>
                    <td>${row.Waktu}</td>
                    <td>${row.Keterangan}</td>
                    <td class="pemasukan">${Number(cleanMasuk) > 0 ? 'Rp '+Number(cleanMasuk).toLocaleString('id-ID') : '-'}</td>
                    <td class="pengeluaran">${Number(cleanKeluar) > 0 ? 'Rp '+Number(cleanKeluar).toLocaleString('id-ID') : '-'}</td>
                    <td><span class="saldo-val">Rp ${Number(cleanAkhir).toLocaleString('id-ID')}</span></td>
                    <td>
                        <button class="btn-edit" onclick='siapkanEdit(${row.No}, "${row.Keterangan}", "${row.Kategori}", ${nominalAsli})'>Edit</button>
                        <button class="btn-hapus" onclick="hapusData(${row.No})">Hapus</button>
                    </td>
                </tr>`;
        });
    } catch (e) { console.error(e); }
}

function siapkanEdit(id, ket, kat, nom) {
    document.getElementById('ket').value = ket;
    document.getElementById('kat').value = kat;
    document.getElementById('nom').value = nom;
    isEditing = true;
    editId = id;
    document.getElementById('formTitle').innerText = "Edit Transaksi #" + id;
    document.getElementById('btnSimpan').innerText = "Update Data";
    document.getElementById('btnBatal').style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function simpanKeScript() {
    const btn = document.getElementById('btnSimpan');
    const ket = document.getElementById('ket').value;
    const kat = document.getElementById('kat').value;
    const nom = document.getElementById('nom').value;

    if (!ket || !nom) return alert("Lengkapi data!");
    btn.disabled = true;

    const payload = { keterangan: ket, kategori: kat, nominal: nom };
    if (isEditing) {
        payload.aksi = 'edit';
        payload.id = editId;
    }

    try {
        await fetch(URL_WEB_APP, { method: 'POST', body: JSON.stringify(payload) });
        resetForm();
        muatData();
    } catch (e) { alert("Gagal!"); } finally { btn.disabled = false; }
}

function resetForm() {
    document.getElementById('ket').value = "";
    document.getElementById('nom').value = "";
    document.getElementById('formTitle').innerText = "Tambah Transaksi";
    document.getElementById('btnSimpan').innerText = "Simpan";
    document.getElementById('btnBatal').style.display = "none";
    isEditing = false;
    editId = null;
}

async function hapusData(id) {
    if (!confirm("Hapus data nomor " + id + "?")) return;
    try {
        await fetch(URL_WEB_APP, { method: 'POST', body: JSON.stringify({ aksi: 'hapus', id: id }) });
        muatData();
    } catch (e) { alert("Gagal!"); }
}

muatData();