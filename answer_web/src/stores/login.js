import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from "axios";
import { ElMessage } from 'element-plus'

export function useLoginStore() {
    const router = useRouter()
    const activeTab = ref('teacher')
    const form = reactive({
        username: '',
        password: '',
        captcha: ''
    })
    const status = ref("false")

    function onSubmit() {
        console.log("登录角色为" + activeTab.value + "登录用户名为" + form.username)
    }
    const loading = ref(false)

    // 登录
    async function loginClick() {
        // 验证输入
        if (!form.username?.trim()) {
            ElMessage.warning("请输入工号/学号")
            return
        }
        if (!form.password?.trim()) {
            ElMessage.warning("请输入密码")
            return
        }

        // 防止重复提交
        if (loading.value) {
            return
        }

        loading.value = true

        try {
            switch (activeTab.value) {
                case 'teacher':
                    const respond = await axios.post('http://localhost:8088/api/teacher/login', {
                        teacherUsername: form.username.trim(),
                        teacherPassword: form.password
                    })
                    const res = respond.data
                    console.log('教师登录响应:', res)

                    if (res.success && res.data) {
                        ElMessage.success("欢迎您，" + res.data.teacherUsername + "老师！")
                        status.value = "success"
                        remPassword()

                        // 保存用户信息到localStorage
                        localStorage.setItem('t_id', res.data.teacherId)
                        localStorage.setItem('teacherId', res.data.teacherId)
                        localStorage.setItem('teacherName', res.data.teacherUsername)
                        localStorage.setItem('teacherHead', res.data.teacherHead || '')
                        localStorage.setItem('teacherEmail', res.data.teacherEmail || '')
                        localStorage.setItem('teacherDepartment', res.data.teacherDepartment || '')
                        localStorage.setItem('teacherLevel', res.data.teacherLevel || '')
                        localStorage.setItem('token', res.data.token)
                        localStorage.setItem('status', 'true')
                        localStorage.setItem('userRole', 'teacher')

                        // 使用新的教师路由
                        await router.push('/teacher/dashboard')
                    } else {
                        ElMessage.error(res.message || '账号或密码错误，请重试')
                    }
                    break

                case 'student':
                    const studentData = {
                        studentsUsername: form.username.trim(),
                        studentsPassword: form.password,
                    }
                    const response = await axios.post(
                        `http://localhost:8088/api/studentLogin`,
                        studentData
                    )
                    const s_res = response.data
                    console.log('学生登录响应:', s_res)

                    if (s_res.success && s_res.data) {
                        const studentInfo = s_res.data.student || s_res.data
                        const token = s_res.data.token

                        status.value = "success"
                        remPassword()
                        ElMessage.success(s_res.data.message || "欢迎您，" + (studentInfo.studentsUsername || form.username) + "同学！")

                        // 保存学生信息到localStorage
                        localStorage.setItem('s_id', studentInfo.studentsId || studentInfo.studentId)
                        localStorage.setItem('studentId', studentInfo.studentsId || studentInfo.studentId)
                        localStorage.setItem('studentName', studentInfo.studentsUsername || studentInfo.studentName)
                        localStorage.setItem('studentHead', studentInfo.studentsHead || '')
                        localStorage.setItem('studentEmail', studentInfo.studentsEmail || '')
                        localStorage.setItem('studentMajor', studentInfo.studentsMajor || '')
                        localStorage.setItem('studentClass', studentInfo.studentsClass || '')
                        localStorage.setItem('s_token', token || '')
                        localStorage.setItem('token', token || '')
                        localStorage.setItem('status', 'true')
                        localStorage.setItem('userRole', 'student')

                        console.log('学生信息已保存到localStorage')
                        await router.push('/student/dashboard')
                    } else {
                        ElMessage.error(s_res.message || '账号或密码错误，请重试')
                    }
                    break
            }
        } catch (error) {
            console.error('登录失败:', error)
            const errorMsg = error.response?.data?.message || error.message || '网络连接失败，请检查网络后重试'
            ElMessage.error(errorMsg)
        } finally {
            loading.value = false
        }
    }
    const rem = ref(false);
    // 记住密码操作
    function remPassword() {
        if (rem.value === true) {
            localStorage.setItem("user", JSON.stringify(form.username))
            localStorage.setItem("status", "true")
        }
        if (rem.value === false) {
            localStorage.removeItem('user')
            localStorage.setItem('status', 'false')
        }
    }
    function setActiveTab(tab) {
        if (tab === 'teacher' || tab === 'student') {
            activeTab.value = tab
        }
    }
    return {
        rem,
        activeTab,
        form,
        loading,
        onSubmit,
        loginClick,
        setActiveTab
    }
}