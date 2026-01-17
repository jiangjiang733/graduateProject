import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import axios from "axios";
// 注册相关的状态管理
export function useRegisterStore() {
  // 这里是选择注册人物，默认的注册人物为教师
  const activeTab = ref('teacher')
  const forms = reactive({
    username: '',
    email: '',
    password: '',
    confirm_code: '',
    imageCaptcha: '',
    department: '',
    level: ''
  })
  // 验证码相关状态
  const countdown = ref(0)
  const isSending = ref(false)
  // 表单引用
  const registerFormRef = ref()
  // 空的验证规则（保留rules对象以确保表单正常工作,后续再添加上去）
  const rules = {}
  // 获取验证码
  async function getVerificationCode() {
    if (!forms.email) {
      ElMessage.error('请输入邮箱地址')
      return
    }
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forms.email)) {
      ElMessage.error('请输入正确的邮箱地址')
      return
    }
    isSending.value = true
    countdown.value = 60
    try {
      // 模拟发送验证码请求
      console.log('发送验证码到:', forms.email)
      // 异步验证码邮箱
      // await sendVerificationCode(forms.email)

      ElMessage.success('验证码已发送到您的邮箱')

      // 开始倒计时
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
          isSending.value = false
        }
      }, 1000)

    } catch (error) {
      ElMessage.error('验证码发送失败，请重试')
      isSending.value = false
      countdown.value = 0
    }
  }
  // 添加loading状态
  const loading = ref(false)

  // 自动校验, 注册函数
  async function register() {
    // 基础字段验证
    if (!forms.username?.trim()) {
      ElMessage.warning("请输入工号/学号")
      return
    }
    if (!forms.password?.trim()) {
      ElMessage.warning("请输入密码")
      return
    }
    if (forms.password.length < 6) {
      ElMessage.warning("密码长度至少为6位")
      return
    }
    if (!forms.email?.trim()) {
      ElMessage.warning("请输入邮箱地址")
      return
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forms.email)) {
      ElMessage.warning('请输入正确的邮箱格式')
      return
    }

    // 教师特殊字段验证
    if (activeTab.value === 'teacher') {
      if (!forms.department?.trim()) {
        ElMessage.warning("请输入院系")
        return
      }
      if (!forms.level) {
        ElMessage.warning("请选择职级")
        return
      }
    }

    // 防止重复提交
    if (loading.value) {
      return
    }

    loading.value = true

    try {
      if (activeTab.value === 'student') {
        // 发送学生注册请求
        const studentData = {
          studentsUsername: forms.username.trim(),
          studentsPassword: forms.password,
          studentsEmail: forms.email.trim(),
        }

        const response = await axios.post(
          `http://localhost:8088/api/addStudent`,
          studentData
        )
        const res = response.data

        if (res.success) {
          ElMessage.success(res.message || '注册成功！')
          resetForm()
        } else {
          // 处理具体的错误信息
          if (res.en) {
            ElMessage.error(res.en)
            forms.username = ''
            forms.email = ''
          } else if (res.names) {
            ElMessage.error(res.names)
            forms.username = ''
          } else if (res.emails) {
            ElMessage.error(res.emails)
            forms.email = ''
          } else {
            ElMessage.error(res.message || '注册失败，请重试')
          }
        }
      } else if (activeTab.value === 'teacher') {
        // 发送教师注册请求
        const teacherData = {
          teacherUsername: forms.username.trim(),
          teacherPassword: forms.password,
          teacherEmail: forms.email.trim(),
          teacherDepartment: forms.department.trim(),
          teacherLevel: forms.level
        }

        const response = await axios.post(
          "http://localhost:8088/api/teacher/register",
          teacherData
        )
        const res = response.data

        if (res.code === 200 || res.success) {
          ElMessage.success(res.message || "注册成功！")
          resetForm()
        } else {
          ElMessage.error(res.message || "注册失败，请重试")
        }
      }
    } catch (error) {
      console.error('注册失败:', error)
      const errorMsg = error.response?.data?.message || error.message || '网络连接失败，请稍后重试'
      ElMessage.error(errorMsg)
    } finally {
      loading.value = false
    }
  }
  // 重置表单
  function resetForm() {
    forms.username = ''
    forms.email = ''
    forms.password = ''
    forms.confirm_code = ''
    forms.imageCaptcha = ''
    forms.department = ''
    forms.level = ''
  }
  // 设置标签页
  function setActiveTab(tab) {
    activeTab.value = tab
  }

  return {
    // 状态
    activeTab,
    forms,
    countdown,
    isSending,
    loading,
    registerFormRef,
    resetForm,
    // 规则
    rules,
    // 方法
    getVerificationCode,
    register,
    setActiveTab
  }
}