<script setup>
import { Users, ClipboardCheck, Syringe, HeartPulse, CalendarDays, Bell, ArrowRight, CheckCircle2, AlertCircle, Info, Activity } from 'lucide-vue-next'
import StatCard from '../components/StatCard.vue'
import ChartCard from '../components/ChartCard.vue'
const stats=[{title:'Total Pasien',value:'3.842',change:'+5,2%',icon:Users,tone:'mint'},{title:'Kunjungan Hari Ini',value:'126',change:'+12%',icon:ClipboardCheck,tone:'blue'},{title:'Imunisasi',value:'52',change:'+8%',icon:Syringe,tone:'purple'},{title:'Pemeriksaan CKG',value:'78',change:'+10%',icon:HeartPulse,tone:'peach'}]
const activities=[{name:'Pemeriksaan Kesehatan Gratis (PKG)',place:'Program pemeriksaan kesehatan',date:'20 Nov 2026'},{name:'CKG Anak Pra Sekolah',place:'Layanan kesehatan anak',date:'18 Nov 2026'},{name:'Surveilans Kesehatan Jiwa (P3LP)',place:'Pendataan dan pemantauan',date:'20 Nov 2026'}]
const notices=[{title:'Data P3LP berhasil diinput',desc:'Contoh notifikasi sistem',time:'10.30',icon:CheckCircle2,tone:'ok'},{title:'Sinkronisasi data selesai',desc:'Contoh notifikasi layanan',time:'09.15',icon:Info,tone:'info'},{title:'Pemeriksaan perangkat diperlukan',desc:'Contoh peringatan perangkat',time:'Kemarin',icon:AlertCircle,tone:'warn'}]
</script>
<template>
<div class="demo-banner">
    <Info :size="17"/> Mode demo: seluruh angka dan aktivitas di halaman ini adalah data simulasi, bukan data pasien asli.</div>
    <section class="hero"><div><span class="eyebrow"><Activity :size="15"/> PUSKESMAS KESAMBI • KOTA CIREBON</span>
        <h1>Selamat Datang, Admin <span>👋</span></h1>
        <p>Pantau aktivitas pelayanan dan kelola informasi kesehatan dengan lebih mudah dalam satu dashboard.</p><router-link to="/pelayanan" class="hero-link">Kelola Pelayanan <ArrowRight :size="17"/>
</router-link></div>
<div class="hero-art">
    <div class="hero-circle">
        <HeartPulse :size="86" :stroke-width="1.4"/></div>
        <div class="hero-float"><CheckCircle2 :size="17"/> Layanan Terintegrasi</div></div>
    </section>
    <div class="stats-grid"><StatCard v-for="s in stats" :key="s.title" v-bind="s"/>
    </div>
    <ChartCard/>
    <div class="bottom-grid">
        <section class="panel">
            <div class="panel-head">
                <div>
                    <h3>Kegiatan Program Kesehatan</h3>
                    <p>Ringkasan kegiatan terbaru</p>
                </div>
                <router-link 
                to="/kegiatan" class="view-all">Lihat Semua <ArrowRight :size="16"/>
            </router-link>
        </div>
        <div v-for="(item,i) in activities" :key="item.name" class="activity-item">
        <span 
        class="round-icon"><CalendarDays :size="19"/>
        </span>
        <div class="activity-info">
        <strong>{{item.name}}</strong>
        <small>{{item.place}}</small>
        </div>
    <span class="activity-date">{{item.date}}</span></div>
    </section>
    <section class="panel">
        <div class="panel-head"><div><h3>Notifikasi Terbaru</h3><p>Informasi dan pembaruan sistem</p></div></div>
        <div v-for="n in notices" :key="n.title" class="activity-item"><span class="round-icon" :class="n.tone"><component :is="n.icon" :size="19"/></span><div class="activity-info"><strong>{{n.title}}</strong>
            <small>{{n.desc}}</small></div><span class="activity-date">{{n.time}}</span></div></section></div>
    </template>
