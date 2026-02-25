function showPage(id) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show selected page
    document.getElementById(id).classList.add('active');

    // Remove active class from all nav buttons
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));

    // Add active class to clicked button
    event.currentTarget.classList.add('active');
}

// Helper functions for degrees/radians conversion
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function toDegrees(radians) {
    return radians * (180 / Math.PI);
}

document.getElementById('btnlokasi').addEventListener('click', ambilLokasi);

function ambilLokasi() {
    if (!navigator.geolocation) {
        alert('Geolocation tidak didukung oleh browser Anda');
        return;
    }

    const btnLokasi = document.getElementById('btnlokasi');
    const hasilElement = document.getElementById('hasil');

    // Show loading state
    btnLokasi.disabled = true;
    btnLokasi.style.opacity = '0.6';
    hasilElement.innerHTML = '⏳ Mendeteksi lokasi...';

    navigator.geolocation.getCurrentPosition(posisiBerhasil, posisiGagal);
}

function posisiBerhasil(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // Koordinat Ka'bah
    const latKaBah = 21.4225;
    const longKaBah = 39.8262;

    const arah = hitungArahKiblat(latitude, longitude, latKaBah, longKaBah);

    //putar jarum kompas dengan animasi halus
    const needle = document.querySelector('.needle');
    needle.style.transform = `translate(-50%) rotate(${arah}deg)`;

    // Update hasil dengan format yang lebih menarik
    const btnLokasi = document.getElementById('btnlokasi');
    btnLokasi.disabled = false;
    btnLokasi.style.opacity = '1';

    document.getElementById('hasil').innerHTML = `
        <strong>✓ Lokasi Terdeteksi</strong><br>
        <div style="margin-top: 12px; font-size: 14px;">
            📍 Latitude: ${latitude.toFixed(6)}<br>
            📍 Longitude: ${longitude.toFixed(6)}<br>
            <strong style="color: #667eea; font-size: 16px; display: block; margin-top: 8px;">
            ◀ Arah Kiblat: ${arah.toFixed(2)}° dari Utara ▶
            </strong>
        </div>
    `;

    // Update lokasi page if it exists
    const lokasiSection = document.getElementById('lokasi');
    if (lokasiSection) {
        lokasiSection.innerHTML = `
            <h2>Lokasi Anda</h2>
            <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); padding: 16px; border-radius: 12px; margin-top: 16px;">
                <p>📍 Latitude: <strong>${latitude.toFixed(6)}</strong></p>
                <p>📍 Longitude: <strong>${longitude.toFixed(6)}</strong></p>
                <p style="margin-top: 12px; color: #667eea; font-weight: bold;">Arah Kiblat: ${arah.toFixed(2)}°</p>
            </div>
        `;
    }

    // Ambil jadwal sholat berdasarkan lokasi
    tampilkanKota(latitude, longitude);
}

function hitungArahKiblat(lat1, lon1, lat2, lon2) {
    const dLon = toRadians(lon2 - lon1);

    const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
    const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
        Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);

    const brng = Math.atan2(y, x);
    return (toDegrees(brng) + 360) % 360;
}

function posisiGagal() {
    const btnLokasi = document.getElementById('btnlokasi');
    btnLokasi.disabled = false;
    btnLokasi.style.opacity = '1';

    document.getElementById('hasil').innerHTML = '❌ Gagal mendeteksi lokasi. Pastikan Anda memberikan izin akses lokasi.';
    alert('Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.');
}

function ambilJadwalSholat(kota) {
    const kotaEncoded = encodeURIComponent(kota);
    const Url = `https://api.pray.zone/v2/times/today.json?city=${kotaEncoded}`;

    console.log('Mengambil jadwal sholat untuk kota:', kota);

    // Update loading state
    document.getElementById('kotaJadwal').innerText = '⏳ Memuat jadwal...';
    document.getElementById('tanggal').innerText = '⏳ Memuat...';
    document.getElementById('subuh').innerText = '-';
    document.getElementById('dzuhur').innerText = '-';
    document.getElementById('ashar').innerText = '-';
    document.getElementById('maghrib').innerText = '-';
    document.getElementById('isya').innerText = '-';

    fetch(Url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Response dari API:', data);

            if (data.code === 200 && data.data) {
                try {
                    const jadwal = data.data.timings;
                    const tanggal = data.data.date.readable || new Date().toLocaleDateString('id-ID');

                    // Format waktu (hapus detik jika ada)
                    const formatWaktu = (waktu) => {
                        if (!waktu) return '-';
                        return waktu.split(':').slice(0, 2).join(':');
                    };

                    // Update display (halaman jadwal)
                    document.getElementById('kotaJadwal').innerText = `📍 Kota: ${kota}`;
                    document.getElementById('tanggal').innerText = `📅 Tanggal: ${tanggal}`;
                    document.getElementById('subuh').innerText = formatWaktu(jadwal.Fajr);
                    document.getElementById('dzuhur').innerText = formatWaktu(jadwal.Dhuhr);
                    document.getElementById('ashar').innerText = formatWaktu(jadwal.Asr);
                    document.getElementById('maghrib').innerText = formatWaktu(jadwal.Maghrib);
                    document.getElementById('isya').innerText = formatWaktu(jadwal.Isha);

                    console.log('✓ Jadwal sholat berhasil dimuat');
                } catch (e) {
                    console.error('Error parsing jadwal:', e);
                    tampilkanErrorJadwal(kota, 'Format data tidak sesuai');
                }
            } else {
                throw new Error('Kota tidak ditemukan di database');
            }
        })
        .catch(error => {
            console.error('❌ Gagal ambil jadwal:', error);
            tampilkanErrorJadwal(kota, error.message);
        });
}

function tampilkanErrorJadwal(kota, pesan) {
    document.getElementById('kotaJadwal').innerText = `📍 Kota: ${kota}`;
    document.getElementById('tanggal').innerText = `⚠️ Error: ${pesan}`;
    document.getElementById('subuh').innerText = '-';
    document.getElementById('dzuhur').innerText = '-';
    document.getElementById('ashar').innerText = '-';
    document.getElementById('maghrib').innerText = '-';
    document.getElementById('isya').innerText = '-';

    // Tampilkan jadwal dashboard
    // document.getElementById('jadwal-dashboard').style.display = 'block';
}

function tampilkanKota(latitude, longitude) {
    const Url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;

    console.log('Mencari nama kota dari koordinat:', latitude, longitude);

    fetch(Url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Response Nominatim:', data);

            // Priority: city > town > village > county > region
            const kota = data.address?.city
                || data.address?.town
                || data.address?.village
                || data.address?.county
                || data.address?.region
                || 'Unknown';

            console.log('✓ Kota ditemukan:', kota);
            ambilJadwalSholat(kota);
        })
        .catch(error => {
            console.error('❌ Gagal ambil kota:', error);
            document.getElementById('kotaJadwal').innerText = `⚠️ Kota: Tidak terdeteksi`;
            document.getElementById('tanggal').innerText = `⚠️ Error: ${error.message}`;
        });
}