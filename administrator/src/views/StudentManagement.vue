<template>
  <div class="student-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学生管理</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加学生
          </el-button>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索学生姓名、学号"
          style="width: 300px"
          clearable
          @keyup.enter="loadStudents"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        

        
        <el-button type="primary" @click="loadStudents" style="margin-left: 10px">
          搜索
        </el-button>
        
        <el-button
          type="danger"
          :disabled="selectedIds.length === 0"
          @click="handleBatchDelete"
          style="margin-left: 10px"
        >
          批量删除
        </el-button>
      </div>
      
      <!-- 表格 -->
      <el-table
        :data="students"
        v-loading="loading"
        style="margin-top: 20px"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="studentsId" label="学号" width="120" />
        <el-table-column prop="studentsUsername" label="姓名" width="120" />
        <el-table-column prop="studentsEmail" label="邮箱" />
        <el-table-column prop="studentsMajor" label="专业" width="120" />
        <el-table-column prop="studentsGrade" label="年级" width="100" />
        <el-table-column label="密码" width="150">
          <template #default="{ row }">
            <div class="password-cell">
              <span v-if="visiblePasswords['s' + row.studentsId]">
                {{ row.studentsPassword || row.students_password || '-' }}
              </span>
              <span v-else style="color: #909399; font-family: monospace;">••••••••</span>
              <el-button 
                type="primary" 
                link 
                id="toggle-password-btn"
                @click="togglePasswordVisibility('s' + row.studentsId)"
                style="margin-left: 8px"
              >
                <el-icon><View v-if="!visiblePasswords['s' + row.studentsId]" /><Hide v-else /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="info" @click="handleResetPassword(row)">
              重置密码
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.pageNumber"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="loadStudents"
        @current-change="loadStudents"
      />
    </el-card>
    
    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑学生' : '添加学生'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <!-- studentsId is auto-increment, maybe not input? Or is it manually entered? User interface says "学号" -->
        <!-- Looking at entity: studentsId is AUTO. So add hidden id field. -->
        <!-- Need a username field -->
        
        <el-form-item label="姓名" prop="studentsUsername">
          <el-input v-model="form.studentsUsername" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="studentsEmail">
          <el-input v-model="form.studentsEmail" />
        </el-form-item>
        
        <el-form-item label="专业" prop="studentsMajor">
          <el-input v-model="form.studentsMajor" />
        </el-form-item>
        
        <el-form-item label="年级" prop="studentsGrade">
          <el-input v-model="form.studentsGrade" />
        </el-form-item>
        
        <el-form-item label="密码" prop="studentsPassword" v-if="!isEdit">
          <el-input v-model="form.studentsPassword" type="password" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, View, Hide } from '@element-plus/icons-vue'
import {
  getStudentList,
  createStudent,
  updateStudent,
  deleteStudent,
  batchDeleteStudents,
  resetStudentPassword,
  type Student
} from '@/api/user'

const visiblePasswords = reactive<Record<string, boolean>>({})

const togglePasswordVisibility = (id: string) => {
  visiblePasswords[id] = !visiblePasswords[id]
}

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const students = ref<Student[]>([])
const selectedIds = ref<number[]>([])

const searchForm = reactive({
  keyword: ''
})

const pagination = reactive({
  pageNumber: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  studentsId: 0, // PK
  studentsUsername: '',
  studentsEmail: '',
  studentsMajor: '',
  studentsGrade: '',
  studentsPassword: ''
})

const formRules: FormRules = {
  studentsUsername: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  studentsEmail: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  studentsPassword: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const loadStudents = async () => {
  loading.value = true
  try {
    const response = await getStudentList({
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword
    })
    
    if (response.code === 200 && response.data) {
      students.value = response.data.list || []
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    console.error('加载学生列表失败:', error)
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: Student) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      if (isEdit.value) {
        await updateStudent(form.studentsId, form)
        ElMessage.success('更新成功')
      } else {
        await createStudent(form)
        ElMessage.success('添加成功')
      }
      
      dialogVisible.value = false
      loadStudents()
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      submitting.value = false
    }
  })
}

const handleDelete = async (row: Student) => {
  try {
    await ElMessageBox.confirm('确定要删除该学生吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteStudent(row.studentsId!)
    ElMessage.success('删除成功')
    loadStudents()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个学生吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await batchDeleteStudents(selectedIds.value)
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    loadStudents()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

const handleResetPassword = async (row: Student) => {
  try {
    await ElMessageBox.confirm('确定要重置该学生的密码吗？密码将重置为默认密码。', '重置确认', {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await resetStudentPassword(row.studentsId!)
    
    await ElMessageBox.alert(
      '<div style="text-align: center; padding: 10px;">' +
      '<p style="font-size: 16px; margin-bottom: 10px;">密码重置成功！</p>' +
      '<p style="color: #666;">重置后的密码为：</p>' +
      '<div style="background: #f0f9eb; color: #67c23a; font-size: 24px; font-weight: bold; padding: 15px; border-radius: 8px; margin-top: 5px; letter-spacing: 2px;">123456</div>' +
      '</div>',
      '重置结果',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '知道了',
        center: true
      }
    )
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置密码失败:', error)
    }
  }
}

const handleSelectionChange = (selection: Student[]) => {
  // Use studentsId for selection
  selectedIds.value = selection.map(item => item.studentsId!)
}

const resetForm = () => {
  Object.assign(form, {
    studentsId: 0,
    studentsUsername: '',
    studentsEmail: '',
    studentsMajor: '',
    studentsGrade: '',
    studentsPassword: ''
  })
  formRef.value?.clearValidate()
}

onMounted(() => {
  loadStudents()
})
</script>

<style scoped>
.student-management {
  padding: 24px;
  background-color: #f8fafc;
  min-height: 100vh;
}

.el-card {
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

:deep(.el-table th) {
  background-color: #f8fafc !important;
  color: #475569;
  font-weight: 600;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: #f8fafc;
}

:deep(.el-button--primary) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

:deep(.el-button--primary:hover) {
  background-color: #2563eb;
  border-color: #2563eb;
}

:deep(.el-button--danger) {
  background-color: #ef4444;
  border-color: #ef4444;
}
</style>
