const URL_WEB_APP =
  "https://script.google.com/macros/s/AKfycbygk5ta35jaPYK-utu7dDoKEhsPASeWUvQjjroF9MT2mPPPvmZ1rXQYeaJMkJUy5qeOVw/exec";
let isEditing = false;
let editId = null;

function showLoading(show) {
  const loader = document.getElementById("loadingOverlay");
  if (loader) loader.style.display = show ? "flex" : "none";
}

async function muatData() {
  showLoading(true);
  const tbody = document.getElementById("isiTabel");
  const displaySaldoAtas = document.getElementById("totalSaldoAtas");

  // Ambil filter tanggal
  const tglMulai = document.getElementById("tglMulai").value;
  const tglSelesai = document.getElementById("tglSelesai").value;

  try {
    const res = await fetch(URL_WEB_APP);
    const data = await res.json();
    tbody.innerHTML = "";

    if (data.length === 0) {
      displaySaldoAtas.innerText = "Rp 0";
      tbody.innerHTML =
        "<tr><td colspan='9' style='text-align:center'>Belum ada data.</td></tr>";
      return;
    }

    // Tampilkan saldo terakhir asli dari database
    const sAkhirRaw = data[data.length - 1].SaldoAkhir.toString().replace(
      /[^0-9.-]+/g,
      "",
    );
    displaySaldoAtas.innerText =
      "Rp " + Number(sAkhirRaw).toLocaleString("id-ID");

    // Filter Mutasi
    let filtered = data.filter((row) => {
      if (!tglMulai || !tglSelesai) return true; // Tampilkan semua jika filter kosong

      // Konversi teks "08 Apr 2026" menjadi objek Date
      const tglBaris = new Date(row.Tanggal);
      const mulai = new Date(tglMulai);
      const selesai = new Date(tglSelesai);

      // Reset jam agar perbandingan hanya pada tanggal
      mulai.setHours(0, 0, 0, 0);
      selesai.setHours(23, 59, 59, 999);
      tglBaris.setHours(0, 0, 0, 0);

      return tglBaris >= mulai && tglBaris <= selesai;
    });

    if (filtered.length === 0) {
      tbody.innerHTML =
        "<tr><td colspan='9' style='text-align:center'>Tidak ada transaksi pada rentang tanggal ini.</td></tr>";
      return;
    }

    filtered.reverse().forEach((row) => {
      const cMasuk = row.SaldoMasuk.toString().replace(/[^0-9.-]+/g, "");
      const cKeluar = row.SaldoKeluar.toString().replace(/[^0-9.-]+/g, "");
      const cAkhir = row.SaldoAkhir.toString().replace(/[^0-9.-]+/g, "");
      const nomAsli = Number(cMasuk) > 0 ? Number(cMasuk) : Number(cKeluar);

      const format = (v) =>
        Number(v) > 0 ? "Rp " + Number(v).toLocaleString("id-ID") : "-";

      tbody.innerHTML += `
                <tr>
                    <td>${row.No}</td>
                    <td><b>${row.Hari}</b></td>
                    <td>${row.Tanggal}</td>
                    <td>${row.Waktu}</td>
                    <td>${row.Keterangan}</td>
                    <td class="pemasukan">${format(cMasuk)}</td>
                    <td class="pengeluaran">${format(cKeluar)}</td>
                    <td><span class="saldo-val">Rp ${Number(cAkhir).toLocaleString("id-ID")}</span></td>
                    <td>
                        <button class="btn-edit" onclick='siapkanEdit(${row.No}, "${row.Keterangan}", "${row.Kategori}", ${nomAsli})' style="background:#ffc107; color:black; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Edit</button>
                        <button class="btn-hapus" onclick="hapusData(${row.No})" style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Hapus</button>
                    </td>
                </tr>`;
    });
  } catch (e) {
    console.error(e);
    tbody.innerHTML =
      "<tr><td colspan='9' style='text-align:center; color:red'>Gagal memuat data.</td></tr>";
  } finally {
    showLoading(false);
  }
}

async function simpanKeScript() {
  const ket = document.getElementById("ket").value;
  const kat = document.getElementById("kat").value;
  const nom = document.getElementById("nom").value;

  if (!ket || !nom) return Swal.fire("Lengkapi data!", "", "warning");

  showLoading(true);
  const payload = { keterangan: ket, kategori: kat, nominal: nom };
  if (isEditing) {
    payload.aksi = "edit";
    payload.id = editId;
  }

  try {
    await fetch(URL_WEB_APP, { method: "POST", body: JSON.stringify(payload) });
    Swal.fire("Berhasil", "", "success");
    resetForm();
    await muatData();
  } catch (e) {
    Swal.fire("Gagal", "", "error");
  } finally {
    showLoading(false);
  }
}

function siapkanEdit(id, ket, kat, nom) {
  document.getElementById("ket").value = ket;
  document.getElementById("kat").value = kat;
  document.getElementById("nom").value = nom;
  isEditing = true;
  editId = id;
  document.getElementById("formTitle").innerText = "Edit Transaksi #" + id;
  document.getElementById("btnSimpan").innerText = "Update Data";
  document.getElementById("btnBatal").style.display = "inline-block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  document.getElementById("ket").value = "";
  document.getElementById("nom").value = "";
  document.getElementById("kat").value = "Pengeluaran";
  document.getElementById("formTitle").innerText = "Tambah Transaksi";
  document.getElementById("btnSimpan").innerText = "Simpan";
  document.getElementById("btnBatal").style.display = "none";
  isEditing = false;
  editId = null;
}

function resetFilterTanggal() {
  document.getElementById("tglMulai").value = "";
  document.getElementById("tglSelesai").value = "";
  muatData();
}

async function hapusData(id) {
  const res = await Swal.fire({
    title: "Hapus data ini?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus!",
  });

  if (res.isConfirmed) {
    showLoading(true);
    try {
      await fetch(URL_WEB_APP, {
        method: "POST",
        body: JSON.stringify({ aksi: "hapus", id: id }),
      });
      await muatData();
      Swal.fire("Terhapus!", "", "success");
    } catch (e) {
      Swal.fire("Gagal!", "", "error");
    } finally {
      showLoading(false);
    }
  }
}

muatData();
