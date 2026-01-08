<template>
  <div class="teacher-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>教师管理</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加教师
          </el-button>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索教师姓名、工号"
          style="width: 300px"
          clearable
          @keyup.enter="loadTeachers"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        

        
        <el-button type="primary" @click="loadTeachers" style="margin-left: 10px">
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
        :data="teachers"
        v-loading="loading"
        style="margin-top: 20px"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="teacherId" label="工号" width="120" />
        <el-table-column prop="teacherUsername" label="姓名" width="120" />
        <el-table-column prop="teacherEmail" label="邮箱" />
        <el-table-column prop="teacherPhone" label="电话" width="130" />
        <el-table-column prop="teacherDepartment" label="院系" width="150" />
        <el-table-column prop="teacherLevel" label="职称" width="100" />
        <el-table-column label="密码" width="150">
          <template #default="{ row }">
            <div class="password-cell">
              <span v-if="visiblePasswords['t' + row.teacherId]">
                {{ row.teacherPassword || row.teacher_password || '-' }}
              </span>
              <span v-else style="color: #909399; font-family: monospace;">••••••••</span>
              <el-button 
                type="primary" 
                link 
                id="toggle-password-btn"
                @click="togglePasswordVisibility('t' + row.teacherId)"
                style="margin-left: 8px"
              >
                <el-icon><View v-if="!visiblePasswords['t' + row.teacherId]" /><Hide v-else /></el-icon>
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
        @size-change="loadTeachers"
        @current-change="loadTeachers"
      />
    </el-card>
    
    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑教师' : '添加教师'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="工号" prop="teacherId">
          <el-input v-model="form.teacherId" :disabled="isEdit" />
        </el-form-item>
        
        <el-form-item label="姓名" prop="teacherUsername">
          <el-input v-model="form.teacherUsername" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="teacherEmail">
          <el-input v-model="form.teacherEmail" />
        </el-form-item>
        
        <el-form-item label="电话" prop="teacherPhone">
          <el-input v-model="form.teacherPhone" />
        </el-form-item>
        
        <el-form-item label="院系" prop="teacherDepartment">
          <el-input v-model="form.teacherDepartment" />
        </el-form-item>
        
        <el-form-item label="职称" prop="teacherLevel">
          <el-select v-model="form.teacherLevel" style="width: 100%">
            <el-option label="助教" value="助教" />
            <el-option label="讲师" value="讲师" />
            <el-option label="副教授" value="副教授" />
            <el-option label="教授" value="教授" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="密码" prop="teacherPassword" v-if="!isEdit">
          <el-input v-model="form.teacherPassword" type="password" />
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
  getTeacherList,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  batchDeleteTeachers,
  resetTeacherPassword,
  type Teacher
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
const teachers = ref<Teacher[]>([])
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

  // But display prompt has "工号" binding to teacherId (String/Int?).
  // Entity has private Integer teacherId; (PK) AND private String teacherName (username).
  // Is there a separate "Work ID" (工号)?
  // In Teacher.java: teacherId (Integer PK), teacherUsername, teacherPassword, teacherEmail...
  // Usually PK is hidden. But here "工号" is bound to teacherId.
  // Given I cannot see a "workId" field, I assume ID is the work ID.
  // In form, teacherId is disabled in edit mode.
  // Wait, form.teacherId in previous code was string?
  // Previous `form` had `teacherId: ''`.
  // If backend teacherId is Integer PK, then "工号" is the PK.
  // I'll stick to teacherId.
  
  teacherId: '', // as string for input
  teacherUsername: '',
  teacherEmail: '',
  teacherPhone: '',
  teacherDepartment: '',
  teacherLevel: '',
  teacherPassword: ''
})

const formRules: FormRules = {
  teacherId: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  teacherUsername: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  teacherEmail: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  teacherPassword: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const loadTeachers = async () => {
  loading.value = true
  try {
    const response = await getTeacherList({
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword
    })
    
    if (response.code === 200 && response.data) {
      teachers.value = response.data.list || []
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    console.error('加载教师列表失败:', error)
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: Teacher) => {
  isEdit.value = true
  // We need to map row to form. Row has numerical teacherId. Form expects string/number.
  // row contains all entity fields.
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
        await updateTeacher(Number(form.teacherId), { ...form, teacherId: Number(form.teacherId) })
        ElMessage.success('更新成功')
      } else {
        await createTeacher({ ...form, teacherId: Number(form.teacherId) })
        ElMessage.success('添加成功')
      }
      
      dialogVisible.value = false
      loadTeachers()
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      submitting.value = false
    }
  })
}

const handleDelete = async (row: Teacher) => {
  try {
    await ElMessageBox.confirm('确定要删除该教师吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteTeacher(row.teacherId!)
    ElMessage.success('删除成功')
    loadTeachers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个教师吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await batchDeleteTeachers(selectedIds.value)
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    loadTeachers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

const handleResetPassword = async (row: Teacher) => {
  try {
    await ElMessageBox.confirm('确定要重置该教师的密码吗？密码将重置为默认密码。', '重置确认', {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await resetTeacherPassword(row.teacherId!)
    
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

const handleSelectionChange = (selection: Teacher[]) => {
  selectedIds.value = selection.map(item => item.teacherId!)
}

const resetForm = () => {
  Object.assign(form, {
    teacherId: '',
    teacherUsername: '',
    teacherEmail: '',
    teacherPhone: '',
    teacherDepartment: '',
    teacherLevel: '',
    teacherPassword: ''
  })
  formRef.value?.clearValidate()
}

onMounted(() => {
  loadTeachers()
})
</script>

<style scoped>
.teacher-management {
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

:deep(.el-tag) {
  border-radius: 4px;
  padding: 0 12px;
  height: 28px;
  line-height: 26px;
}
</style>
