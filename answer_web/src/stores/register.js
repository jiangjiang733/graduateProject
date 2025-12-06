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
  // 自动校验, 注册函数
  async function register() {
    // 这里是验证注册信息的
    if (!forms.password||!forms.username||!forms.email||!forms.email) {
      ElMessage.error("请完善注册信息")
      return
    }
    else if(activeTab.value === 'student') {
      // 发送注册请求
      try {
        const studentData = {
          studentsUsername: forms.username,
          studentsPassword: forms.password,
          studentsEmail: forms.email,
        };
        const response=await axios.post(
            `http://localhost:8088/api/addStudent`,
            studentData
        )
        const res=response.data
        console.log(res.en)
        if(res.success) {
          ElMessage.success(res.message)
          resetForm()
        }else {
          if(res.en) {
            ElMessage.error(res.en)
            forms.username = ''
            forms.email = ''
          }else if(res.names) {
            ElMessage.error(res.names)
            forms.username = ''
          }else if(res.emails) {
            ElMessage.error(res.emails)
            forms.email = ''
          }
        }
      }
      catch (error) {
        ElMessage.error("学生注册失败，请重试")
        console.log("学生注册错误"+error)
      }
    }
    else if(activeTab.value === 'teacher') {
      try {
        const teacherData={
          teacherUsername: forms.username,
          teacherPassword: forms.password,
          teacherEmail: forms.email,
          teacherDepartment: forms.department || '',
          teacherLevel: forms.level || ''
        }
         const  response=await axios.post(
            "http://localhost:8088/api/teacher/register",
            teacherData
        )
        const res=response.data
        // 表单信息校验
        if(res.code === 200){
          ElMessage.success(res.message || "注册成功")
          resetForm()
        } else {
          ElMessage.error(res.message || "注册失败")
          console.log(res)
        }
      }
      catch(error) {
        ElMessage.error("教师注册失败")
        console.log("教师注册失败"+error)
      }
    }
  }
  // 重置表单
  function resetForm() {
    forms.username = ''
    forms.email = ''
    forms.password = ''
    forms.confirm_code = ''
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