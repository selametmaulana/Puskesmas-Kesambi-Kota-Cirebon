<script setup>
import { Line, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS,CategoryScale,LinearScale,PointElement,LineElement,ArcElement,Tooltip,Legend,Filler } from 'chart.js'
ChartJS.register(CategoryScale,LinearScale,PointElement,LineElement,ArcElement,Tooltip,Legend,Filler)
const line={labels:['1 Nov','3 Nov','5 Nov','7 Nov','9 Nov','11 Nov','13 Nov','15 Nov','17 Nov','19 Nov','21 Nov','23 Nov'],datasets:[{label:'Kunjungan',data:[58,74,91,85,112,98,125,118,139,121,149,132],borderColor:'#0c996d',backgroundColor:'rgba(16,185,129,.13)',tension:.42,fill:true,pointRadius:4,pointBackgroundColor:'#0c996d'}]}
const doughnut={labels:['Umum','KIA','Imunisasi','Gizi','Lainnya'],datasets:[{data:[42,20,14,12,12],backgroundColor:['#0e9f76','#8cdb5d','#f7c948','#4a94f0','#b99af8'],borderWidth:0,hoverOffset:4}]}
const lineOptions={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#edf1f3'}},x:{grid:{display:false}}}}
const pieOptions={responsive:true,maintainAspectRatio:false,cutout:'72%',plugins:{legend:{position:'right',labels:{boxWidth:11,padding:15,font:{size:12}}}}}
</script>
<template><div class="chart-grid"><section class="panel"><div class="panel-head"><div><h3>Tren Kunjungan Pasien</h3><p>Data simulasi • November 2026</p></div><span class="pill">30 Hari</span></div><div class="line-chart"><Line :data="line" :options="lineOptions"/></div></section><section class="panel"><div class="panel-head"><div><h3>Distribusi Layanan</h3><p>Persentase berdasarkan kategori</p></div></div><div class="pie-chart"><Doughnut :data="doughnut" :options="pieOptions"/></div></section></div></template>
