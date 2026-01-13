import { reactive, ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getStudentList, getTeacherList } from '@/api/user'
import { getAnnouncementList } from '@/api/announcement'
import { getSensitiveWordList } from '@/api/sensitive'

export function useDashboard() {
    const loading = ref(false)

    const stats = reactive([
        { label: '学生总数', value: 0, icon: 'User', class: 'bg-blue', trend: '+12% 从上月' },
        { label: '教师总数', value: 0, icon: 'UserFilled', class: 'bg-purple', trend: '+5% 从上月' },
        { label: '公告总数', value: 0, icon: 'Bell', class: 'bg-emerald', trend: '实时发布' },
        { label: '敏感词库', value: 0, icon: 'Warning', class: 'bg-rose', trend: '系统盾牌' }
    ])

    const quickActions = [
        { name: '学生管理', desc: '添加、编辑或删除学生账号', icon: 'User', path: '/students', color: '#eff6ff', iconColor: '#3b82f6' },
        { name: '教师管理', desc: '分配教师权限与信息维护', icon: 'UserFilled', path: '/teachers', color: '#f5f3ff', iconColor: '#8b5cf6' },
        { name: '公告发布', desc: '向全系统推送重要通知信息', icon: 'Bell', path: '/announcements', color: '#ecfdf5', iconColor: '#10b981' },
        { name: '安全中心', desc: '管理敏感词库与系统安全', icon: 'Warning', path: '/sensitive-words', color: '#fff1f2', iconColor: '#f43f5e' }
    ]

    const chartPeriod = ref('week')
    const trendChartRef = ref(null)
    const pieChartRef = ref(null)

    // 异步获取真实统计数据
    const fetchStats = async () => {
        loading.value = true
        try {
            // 通过列表接口获取总数 (pageSize=1)
            const [students, teachers, announcements, sensitive] = await Promise.all([
                getStudentList({ pageNumber: 1, pageSize: 1 }),
                getTeacherList({ pageNumber: 1, pageSize: 1 }),
                getAnnouncementList({ pageNumber: 1, pageSize: 1 }),
                getSensitiveWordList({ pageNumber: 1, pageSize: 1 })
            ])

            stats[0].value = students.data?.total || 0
            stats[1].value = teachers.data?.total || 0
            stats[2].value = announcements.data?.total || 0
            stats[3].value = sensitive.data?.total || 0

            // 数据加载后重新渲染图表
            updateCharts()
        } catch (error) {
            console.error('获取仪表盘统计失败:', error)
        } finally {
            loading.value = false
        }
    }

    let trendChart = null
    let pieChart = null

    const initCharts = () => {
        if (!trendChartRef.value || !pieChartRef.value) return

        trendChart = echarts.init(trendChartRef.value)
        pieChart = echarts.init(pieChartRef.value)

        updateCharts()

        window.addEventListener('resize', () => {
            trendChart?.resize()
            pieChart?.resize()
        })
    }

    const updateCharts = () => {
        if (!trendChart || !pieChart) return

        // 趋势图配置
        trendChart.setOption({
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderWidth: 0,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                textStyle: { color: '#1e293b' }
            },
            grid: { top: 40, right: 30, bottom: 30, left: 40, containLabel: true },
            xAxis: {
                type: 'category',
                data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                axisLine: { lineStyle: { color: '#f1f5f9' } },
                axisLabel: { color: '#94a3b8' }
            },
            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
                axisLabel: { color: '#94a3b8' }
            },
            series: [{
                name: '活跃度',
                data: [120, 190, 150, 210, 180, 250, 230],
                type: 'line',
                smooth: true,
                symbolSize: 8,
                itemStyle: { color: '#3b82f6', borderSize: 2 },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
                        { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
                    ])
                }
            }]
        })

        // 饼图配置
        pieChart.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: '0%', left: 'center', itemGap: 20, icon: 'circle' },
            series: [{
                name: '用户组成',
                type: 'pie',
                radius: ['50%', '75%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 12, borderColor: '#fff', borderWidth: 4 },
                label: { show: false },
                emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
                data: [
                    { value: stats[0].value, name: '学生用户', itemStyle: { color: '#3b82f6' } },
                    { value: stats[1].value, name: '教师用户', itemStyle: { color: '#8b5cf6' } },
                    { value: 1, name: '管理团队', itemStyle: { color: '#10b981' } }
                ]
            }]
        })
    }

    return {
        loading,
        stats,
        quickActions,
        chartPeriod,
        trendChartRef,
        pieChartRef,
        fetchStats,
        initCharts
    }
}
