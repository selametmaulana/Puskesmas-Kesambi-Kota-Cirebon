
<script setup>
import { ref, computed, onMounted } from 'vue'
import {
    Users,
    CalendarClock,
    Pill,
    Clock,
    CheckCircle2,
    AlertCircle,
    MessageCircle,
    ArrowRight,
    Activity,
    RefreshCw,
    CalendarDays,
    Bell
} from 'lucide-vue-next'

import StatCard from '../components/StatCard.vue'
import { supabase } from '../services/supabase'

const pasien = ref([])
const pengingat = ref([])
const totalPasien = ref(0)
const loading = ref(true)
const errorMessage = ref('')

const hariIni = ref(getLocalDate())

function getLocalDate(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date)
}

function getTanggal(value) {
    if (!value) return ''

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return ''

    return getLocalDate(date)
}

function formatTanggal(value) {
    if (!value) return '-'

    const date = new Date(getTanggal(value) + 'T00:00:00+07:00')

    if (Number.isNaN(date.getTime())) return '-'

    return date.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

async function fetchDashboard() {
    loading.value = true
    errorMessage.value = ''
    hariIni.value = getLocalDate()

    try {
        const countResult = await supabase
            .from('pasien')
            .select('id', {
                count: 'exact',
                head: true
            })

        if (countResult.error) throw countResult.error

        // Mengambil seluruh jadwal secara bertahap
        // agar tidak terpotong batas respons Supabase.
        const rows = []
        const pageSize = 500
        let from = 0

        while (true) {
            const { data, error } = await supabase
                .from('pengingat_obat')
                .select(`
                    id,
                    pasien_id,
                    jadwal_ambil,
                    status,
                    status_pengambilan,
                    pengambilan_dicatat_at,
                    pasien (
                        nama_lengkap,
                        kode_pasien
                    )
                `)
                .order('id', { ascending: true })
                .range(from, from + pageSize - 1)

            if (error) throw error

            rows.push(...(data || []))

            if (!data || data.length < pageSize) break

            from += pageSize
        }

        totalPasien.value = countResult.count || 0
        pengingat.value = rows

    } catch (error) {
        errorMessage.value = error.message
        console.error('Gagal memuat dashboard:', error)

    } finally {
        loading.value = false
    }
}

// Statistik jadwal pengambilan obat

const jadwalHariIni = computed(() =>
    pengingat.value.filter(item =>
        getTanggal(item.jadwal_ambil) === hariIni.value
    )
)

const sudahDiambil = computed(() =>
    pengingat.value.filter(item =>
        item.status_pengambilan === 'sudah_diambil'
    )
)

const belumDiambil = computed(() =>
    pengingat.value.filter(item =>
        item.status_pengambilan === 'belum_diambil'
    )
)

const tidakDiambil = computed(() =>
    pengingat.value.filter(item =>
        item.status_pengambilan === 'tidak_diambil'
    )
)

const terlambat = computed(() =>
    pengingat.value.filter(item =>
        item.jadwal_ambil &&
        getTanggal(item.jadwal_ambil) < hariIni.value &&
        item.status_pengambilan === 'belum_diambil'
    )
)

const pesanTerkirim = computed(() =>
    pengingat.value.filter(item =>
        [
            'dikirim_manual',
            'wa_terkirim',
            'wa_diterima',
            'wa_dibaca'
        ].includes(item.status)
    )
)

// Statistik kartu dashboard

const stats = computed(() => [
    {
        title: 'Total Pasien',
        value: totalPasien.value.toLocaleString('id-ID'),
        change: 'Pasien terdaftar',
        icon: Users,
        tone: 'mint'
    },
    {
        title: 'Jadwal Hari Ini',
        value: jadwalHariIni.value.length.toString(),
        change: 'Jadwal pengambilan obat',
        icon: CalendarClock,
        tone: 'blue'
    },
    {
        title: 'Sudah Ambil Obat',
        value: sudahDiambil.value.length.toString(),
        change: 'Pengambilan selesai',
        icon: CheckCircle2,
        tone: 'mint'
    },
    {
        title: 'Belum Ambil Obat',
        value: belumDiambil.value.length.toString(),
        change: 'Menunggu pengambilan',
        icon: Clock,
        tone: 'peach'
    },
    {
        title: 'Terlambat Ambil Obat',
        value: terlambat.value.length.toString(),
        change: 'Perlu ditindaklanjuti',
        icon: AlertCircle,
        tone: 'peach'
    },
    {
        title: 'Pengingat Terkirim',
        value: pesanTerkirim.value.length.toString(),
        change: 'Tercatat dikirim',
        icon: MessageCircle,
        tone: 'purple'
    }
])

// Persentase pengambilan obat

const persentase = computed(() => {
    const total = pengingat.value.length

    if (!total) return 0

    return Math.round(
        (sudahDiambil.value.length / total) * 100
    )
})

// Jadwal mendatang
const jadwalMendatang = computed(() =>
    pengingat.value
        .filter(item =>
            getTanggal(item.jadwal_ambil) >= hariIni.value &&
            item.status_pengambilan === 'belum_diambil'
        )
        .sort((a, b) =>
            getTanggal(a.jadwal_ambil)
                .localeCompare(getTanggal(b.jadwal_ambil))
        )
        .slice(0, 8)
)

// Statistik tujuh hari berdasarkan jadwal

const grafik = computed(() => {
    const result = []

    for (let i = 6; i >= 0; i--) {
        const date = new Date(hariIni.value + 'T12:00:00+07:00')

        date.setDate(date.getDate() - i)

        const key = getLocalDate(date)

        const items = pengingat.value.filter(item =>
            getTanggal(item.jadwal_ambil) === key
        )

        result.push({
            label: date.toLocaleDateString('id-ID', {
                timeZone: 'Asia/Jakarta',
                day: 'numeric',
                month: 'short'
            }),
            total: items.length,
            selesai: items.filter(item =>
                item.status_pengambilan === 'sudah_diambil'
            ).length
        })
    }

    return result
})

const maxGrafik = computed(() =>
    Math.max(1, ...grafik.value.map(item => item.total))
)

onMounted(fetchDashboard)
</script>

<template>

    <!-- Hero Dashboard -->
    <section class="hero">
        <div>
            <span class="eyebrow">
                <Activity :size="15"/>
                PUSKESMAS KESAMBI • KOTA CIREBON
            </span>

            <h1>
                Sistem Pengingat Pengambilan Obat
                <span>💊</span>
            </h1>

            <p>
                Kelola jadwal pengambilan obat pasien,
                pantau status pengambilan, serta lakukan
                pengiriman pengingat melalui WhatsApp.
            </p>

            <router-link
                to="/pasien"
                class="hero-link"
            >
                Kelola Data Pasien
                <ArrowRight :size="17"/>
            </router-link>
        </div>

        <div class="hero-art">
            <div class="hero-circle">
                <Pill :size="86" :stroke-width="1.4"/>
            </div>

            <div class="hero-float">
                <Bell :size="17"/>
                Pengingat Pengambilan Obat
            </div>
        </div>
    </section>

    <!-- Status Database -->
    <div class="dashboard-toolbar">
        <div>
            <h3>Ringkasan Pengambilan Obat</h3>

            <p>
                {{ formatTanggal(hariIni) }} • Data Supabase
            </p>
        </div>

        <button
            class="refresh-button"
            :disabled="loading"
            @click="fetchDashboard"
        >
            <RefreshCw
                :size="17"
                :class="{ spinning: loading }"
            />
            Refresh Data
        </button>
    </div>

    <div v-if="loading" class="dashboard-state">
        Memuat data pengambilan obat...
    </div>

    <div v-else-if="errorMessage" class="dashboard-error">
        <AlertCircle :size="20"/>

        <div>
            <strong>Gagal memuat data dashboard</strong>
            <p>{{ errorMessage }}</p>
        </div>
    </div>

    <template v-else>

        <!-- Kartu Statistik -->
        <div class="medicine-stats">
            <StatCard
                v-for="s in stats"
                :key="s.title"
                v-bind="s"
            />
        </div>

        <!-- Grafik dan Persentase -->
        <div class="medicine-charts">

            <section class="panel">
                <div class="panel-head">
                    <div>
                        <h3>Tren Jadwal Pengambilan Obat</h3>
                        <p>Jadwal dan status pengambilan 7 hari terakhir</p>
                    </div>
                </div>

                <div class="chart-legend">
                    <span>
                        <i class="legend-total"></i>
                        Total Jadwal
                    </span>

                    <span>
                        <i class="legend-done"></i>
                        Sudah Diambil
                    </span>
                </div>

                <div class="medicine-bar-chart">

                    <div
                        v-for="item in grafik"
                        :key="item.label"
                        class="chart-column"
                    >
                        <div class="bar-area">

                            <div
                                class="chart-bar total-bar"
                                :style="{
                                    height: (
                                        item.total / maxGrafik * 100
                                    ) + '%'
                                }"
                                :title="'Total: ' + item.total"
                            >
                                <span v-if="item.total">
                                    {{ item.total }}
                                </span>
                            </div>

                            <div
                                class="chart-bar done-bar"
                                :style="{
                                    height: (
                                        item.selesai / maxGrafik * 100
                                    ) + '%'
                                }"
                                :title="'Selesai: ' + item.selesai"
                            >
                                <span v-if="item.selesai">
                                    {{ item.selesai }}
                                </span>
                            </div>

                        </div>

                        <small>{{ item.label }}</small>
                    </div>

                </div>
            </section>

            <section class="panel">

                <div class="panel-head">
                    <div>
                        <h3>Persentase Pengambilan Obat</h3>
                        <p>Seluruh jadwal pengambilan</p>
                    </div>
                </div>

                <div class="progress-wrapper">

                    <div
                        class="progress-ring"
                        :style="{
                            background: `conic-gradient(
                                #07966f ${persentase}%,
                                #e8eeec 0
                            )`
                        }"
                    >
                        <div class="progress-center">
                            <strong>{{ persentase }}%</strong>
                            <small>Sudah Diambil</small>
                        </div>
                    </div>

                </div>

                <div class="progress-list">

                    <div>
                        <span>
                            <i class="dot green"></i>
                            Sudah Diambil
                        </span>
                        <strong>{{ sudahDiambil.length }}</strong>
                    </div>

                    <div>
                        <span>
                            <i class="dot orange"></i>
                            Belum Diambil
                        </span>
                        <strong>{{ belumDiambil.length }}</strong>
                    </div>

                    <div>
                        <span>
                            <i class="dot red"></i>
                            Tidak Diambil
                        </span>
                        <strong>{{ tidakDiambil.length }}</strong>
                    </div>

                </div>
            </section>

        </div>

        <!-- Jadwal dan Peringatan -->
        <div class="medicine-bottom">

            <section class="panel">

                <div class="panel-head">
                    <div>
                        <h3>Jadwal Pengambilan Obat</h3>
                        <p>Jadwal pasien yang akan datang</p>
                    </div>

                    <router-link
                        to="/pasien"
                        class="view-all"
                    >
                        Lihat Semua
                        <ArrowRight :size="16"/>
                    </router-link>
                </div>

                <div
                    v-if="!jadwalMendatang.length"
                    class="empty-state"
                >
                    <CalendarDays :size="34"/>
                    <p>Belum ada jadwal pengambilan obat.</p>
                </div>

                <div
                    v-for="item in jadwalMendatang"
                    :key="item.id"
                    class="activity-item"
                >
                    <span class="round-icon">
                        <CalendarDays :size="19"/>
                    </span>

                    <div class="activity-info">
                        <strong>
                            {{ item.pasien?.nama_lengkap || 'Pasien' }}
                        </strong>

                        <small>
                            {{ item.pasien?.kode_pasien || '-' }}
                            • {{ formatTanggal(item.jadwal_ambil) }}
                        </small>
                    </div>

                    <span
                        class="medicine-badge"
                        :class="{
                            today: getTanggal(item.jadwal_ambil) === hariIni
                        }"
                    >
                        {{
                            getTanggal(item.jadwal_ambil) === hariIni
                                ? 'Hari Ini'
                                : 'Terjadwal'
                        }}
                    </span>
                </div>

            </section>

            <section class="panel">

                <div class="panel-head">
                    <div>
                        <h3>Peringatan Pengambilan Obat</h3>
                        <p>Pasien yang perlu ditindaklanjuti</p>
                    </div>

                    <Bell :size="20"/>
                </div>

                <div
                    v-if="!terlambat.length"
                    class="empty-state"
                >
                    <CheckCircle2 :size="34"/>
                    <p>Tidak ada jadwal yang terlambat.</p>
                </div>

                <div
                    v-for="item in terlambat.slice(0, 8)"
                    :key="item.id"
                    class="activity-item"
                >
                    <span class="round-icon warn">
                        <AlertCircle :size="19"/>
                    </span>

                    <div class="activity-info">
                        <strong>
                            {{ item.pasien?.nama_lengkap || 'Pasien' }}
                        </strong>

                        <small>
                            Jadwal: {{ formatTanggal(item.jadwal_ambil) }}
                        </small>
                    </div>

                    <span class="medicine-badge late">
                        Terlambat
                    </span>
                </div>

                <router-link
                    v-if="terlambat.length"
                    to="/pasien"
                    class="followup-link"
                >
                    Tindak Lanjuti Pasien
                    <ArrowRight :size="16"/>
                </router-link>

            </section>

        </div>

    </template>
</template>

<style scoped>

.dashboard-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin: 25px 0 18px;
}

.dashboard-toolbar h3 {
    margin: 0 0 5px;
    color: #163d35;
    font-size: 18px;
}

.dashboard-toolbar p {
    margin: 0;
    color: #84968f;
    font-size: 13px;
}

.refresh-button {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #cee3da;
    background: #ffffff;
    color: #087f65;
    padding: 10px 15px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
}

.refresh-button:hover {
    background: #e9f6f0;
}

.refresh-button:disabled {
    opacity: .6;
    cursor: wait;
}

.medicine-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
    margin-bottom: 24px;
}

.medicine-charts {
    display: grid;
    grid-template-columns: 1.65fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
}

.medicine-bottom {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
}

.medicine-charts .panel,
.medicine-bottom .panel {
    min-width: 0;
}

.chart-legend {
    display: flex;
    gap: 20px;
    margin: 20px 0;
    flex-wrap: wrap;
}

.chart-legend span {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #647b74;
    font-size: 12px;
}

.chart-legend i,
.dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.legend-total {
    background: #b5dfd2;
}

.legend-done {
    background: #07966f;
}

.medicine-bar-chart {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 15px 0;
}

.chart-column {
    flex: 1;
    text-align: center;
    min-width: 0;
}

.bar-area {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 5px;
    height: 190px;
    border-bottom: 1px solid #dce8e3;
}

.chart-bar {
    width: 25%;
    max-width: 25px;
    border-radius: 6px 6px 0 0;
    position: relative;
    transition: height .4s ease;
}

.chart-bar span {
    position: absolute;
    top: -19px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    color: #526d64;
}

.total-bar {
    background: #b5dfd2;
}

.done-bar {
    background: #07966f;
}

.chart-column small {
    display: block;
    color: #7c9289;
    font-size: 11px;
    margin-top: 12px;
}

.progress-wrapper {
    display: flex;
    justify-content: center;
    margin: 25px 0;
}

.progress-ring {
    width: 165px;
    height: 165px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.progress-center {
    width: 130px;
    height: 130px;
    border-radius: 50%;
    background: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.progress-center strong {
    color: #078361;
    font-size: 32px;
}

.progress-center small {
    font-size: 12px;
    color: #82958d;
}

.progress-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.progress-list > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #526d64;
    font-size: 13px;
}

.progress-list span {
    display: flex;
    align-items: center;
    gap: 8px;
}

.dot.green {
    background: #07966f;
}

.dot.orange {
    background: #e7a23b;
}

.dot.red {
    background: #df6666;
}

.medicine-badge {
    display: inline-flex;
    padding: 6px 10px;
    font-size: 11px;
    border-radius: 20px;
    background: #e6f1fd;
    color: #3678bb;
    white-space: nowrap;
}

.medicine-badge.today {
    background: #fff0d5;
    color: #a66b0b;
}

.medicine-badge.late {
    background: #ffe9e9;
    color: #c83e3e;
}

.empty-state {
    padding: 40px 15px;
    display: flex;
    align-items: center;
    flex-direction: column;
    text-align: center;
    color: #91aaa0;
    font-size: 13px;
}

.followup-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-decoration: none;
    background: #edf8f3;
    color: #087f65;
    border-radius: 9px;
    padding: 12px;
    margin-top: 18px;
    font-size: 13px;
    font-weight: 600;
}

.dashboard-state {
    padding: 30px;
    background: white;
    color: #678478;
    text-align: center;
    border-radius: 12px;
}

.dashboard-error {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff0f0;
    color: #be3d3d;
    padding: 18px;
    border-radius: 12px;
}

.dashboard-error p {
    margin: 5px 0 0;
}

.spinning {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@media (max-width: 1100px) {
    .medicine-stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .medicine-charts,
    .medicine-bottom {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 600px) {
    .medicine-stats {
        grid-template-columns: 1fr;
        gap: 12px;
    }

    .dashboard-toolbar {
        align-items: flex-start;
        flex-direction: column;
    }

    .medicine-bar-chart {
        gap: 4px;
    }
}

</style>
