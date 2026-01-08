<template>
  <div class="sensitive-word-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>敏感词管理</span>
          <div>
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              添加敏感词
            </el-button>
            <el-button type="success" @click="showImportDialog">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
            <el-button type="info" @click="showTestDialog">
              <el-icon><Search /></el-icon>
              测试文本
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索敏感词"
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="searchForm.category"
          placeholder="分类"
          style="width: 150px; margin-left: 10px"
          clearable
        >
          <el-option label="全部" value="" />
          <el-option label="脏话" value="PROFANITY" />
          <el-option label="政治" value="POLITICAL" />
          <el-option label="暴力" value="VIOLENCE" />
          <el-option label="其他" value="OTHER" />
        </el-select>
        
        <el-select
          v-model="searchForm.level"
          placeholder="级别"
          style="width: 150px; margin-left: 10px"
          clearable
        >
          <el-option label="全部" :value="undefined" />
          <el-option label="轻度" :value="1" />
          <el-option label="中度" :value="2" />
          <el-option label="严重" :value="3" />
        </el-select>
        
        <el-button type="primary" @click="loadSensitiveWords" style="margin-left: 10px">
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
        :data="sensitiveWords"
        v-loading="loading"
        style="margin-top: 20px"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="word" label="敏感词" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.category || '通用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="敏感级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelTag(row.level)">{{ getLevelText(row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="处理动作" width="100">
          <template #default="{ row }">
            {{ getActionText(row.action) }}
          </template>
        </el-table-column>
        <el-table-column prop="replacement" label="替换词" width="120">
          <template #default="{ row }">
            {{ row.replacement || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
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
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="loadSensitiveWords"
        @current-change="loadSensitiveWords"
      />
    </el-card>
    
    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑敏感词' : '添加敏感词'"
      width="600px"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="敏感词" prop="word">
          <el-input v-model="form.word" />
        </el-form-item>
        
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="脏话" value="PROFANITY" />
            <el-option label="政治" value="POLITICAL" />
            <el-option label="暴力" value="VIOLENCE" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="级别" prop="level">
          <el-select v-model="form.level" style="width: 100%">
            <el-option label="轻度" :value="1" />
            <el-option label="中度" :value="2" />
            <el-option label="严重" :value="3" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="处理方式" prop="action">
          <el-select v-model="form.action" style="width: 100%">
            <el-option label="替换" value="REPLACE" />
            <el-option label="屏蔽" value="BLOCK" />
            <el-option label="警告" value="WARN" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="替换词" prop="replacement" v-if="form.action === 'REPLACE'">
          <el-input v-model="form.replacement" placeholder="如: ***" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入敏感词" width="600px">
      <el-form :model="importForm" label-width="100px">
        <el-form-item label="敏感词">
          <el-input
            v-model="importForm.words"
            type="textarea"
            :rows="10"
            placeholder="每行一个敏感词"
          />
        </el-form-item>
        
        <el-form-item label="分类">
          <el-select v-model="importForm.category" style="width: 100%">
            <el-option label="脏话" value="PROFANITY" />
            <el-option label="政治" value="POLITICAL" />
            <el-option label="暴力" value="VIOLENCE" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="级别">
          <el-select v-model="importForm.level" style="width: 100%">
            <el-option label="轻度" :value="1" />
            <el-option label="中度" :value="2" />
            <el-option label="严重" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :loading="submitting">
          导入
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 测试对话框 -->
    <el-dialog v-model="testDialogVisible" title="测试敏感词" width="600px">
      <el-input
        v-model="testForm.text"
        type="textarea"
        :rows="6"
        placeholder="输入要测试的文本"
      />
      
      <div v-if="testForm.result" class="test-result">
        <el-divider />
        <h4>检测结果:</h4>
        <p v-if="testForm.result.hasSensitiveWords" style="color: #f56c6c;">
          检测到 {{ testForm.result.words?.length || 0 }} 个敏感词
        </p>
        <p v-else style="color: #67c23a;">未检测到敏感词</p>
        
        <div v-if="testForm.result.words && testForm.result.words.length > 0">
          <el-tag
            v-for="(word, index) in testForm.result.words"
            :key="index"
            type="danger"
            style="margin: 5px"
          >
            {{ word }}
          </el-tag>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="testDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleTest" :loading="loading">
          测试
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Upload, Refresh } from '@element-plus/icons-vue'
import {
  getSensitiveWordList,
  createSensitiveWord,
  updateSensitiveWord,
  deleteSensitiveWord,
  batchDeleteSensitiveWords,
  importSensitiveWords,
  toggleSensitiveWordStatus,
  testSensitiveWord,
  type SensitiveWord
} from '@/api/sensitive'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const testDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const importFormRef = ref<FormInstance>()
const testFormRef = ref<FormInstance>()
const sensitiveWords = ref<SensitiveWord[]>([])
const selectedIds = ref<number[]>([])

const searchForm = reactive({
  keyword: '',
  category: '',
  level: undefined as number | undefined
})

const pagination = reactive({
  pageNumber: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: 0,
  word: '',
  category: '',
  level: 1,
  action: 'REPLACE',
  replacement: '',
  status: 1
})

const importForm = reactive({
  words: '',
  category: '',
  level: 1
})

const testForm = reactive({
  text: '',
  result: null as any
})

const formRules: FormRules = {
  word: [{ required: true, message: '请输入敏感词', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  level: [{ required: true, message: '请选择敏感级别', trigger: 'change' }],
  action: [{ required: true, message: '请选择处理动作', trigger: 'change' }]
}

const getCategoryTag = (category: string) => {
  const map: Record<string, string> = {
    POLITICAL: 'danger',
    VIOLENCE: 'warning',
    PORN: 'danger',
    ADVERTISEMENT: 'info',
    PROFANITY: 'danger', // Added PROFANITY
    OTHER: 'info' // Added OTHER
  }
  return map[category] || 'info'
}

const getCategoryText = (category: string) => {
  const map: Record<string, string> = {
    POLITICAL: '政治',
    VIOLENCE: '暴力',
    PORN: '色情',
    ADVERTISEMENT: '广告',
    PROFANITY: '脏话', // Added PROFANITY
    OTHER: '其他' // Added OTHER
  }
  return map[category] || category || '通用'
}

const getLevelTag = (level: number) => {
  const map: Record<number, string> = {
    1: 'info',
    2: 'warning',
    3: 'danger'
  }
  return map[level] || 'info'
}

const getLevelText = (level: number) => {
  const map: Record<number, string> = {
    1: '低',
    2: '中',
    3: '高'
  }
  return map[level] || '未知'
}

const getActionText = (action: string) => {
  const map: Record<string, string> = {
    REPLACE: '替换',
    BLOCK: '屏蔽',
    WARN: '警告'
  }
  return map[action] || '未知'
}

const loadSensitiveWords = async () => {
  loading.value = true
  try {
    const response = await getSensitiveWordList({
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      category: searchForm.category,
      level: searchForm.level
    })
    
    if (response.code === 200 && response.data) {
      sensitiveWords.value = response.data.list || []
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    console.error('加载敏感词列表失败:', error)
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const showImportDialog = () => {
  importForm.words = ''
  importForm.category = ''
  importForm.level = 1
  importDialogVisible.value = true
  importFormRef.value?.resetFields() // Reset validation
}

const showTestDialog = () => {
  testForm.text = ''
  testForm.result = null
  testDialogVisible.value = true
  testFormRef.value?.resetFields() // Reset validation
}

const handleEdit = (row: SensitiveWord) => {
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
        await updateSensitiveWord(form.id, form)
        ElMessage.success('更新成功')
      } else {
        await createSensitiveWord(form)
        ElMessage.success('添加成功')
      }
      
      dialogVisible.value = false
      loadSensitiveWords()
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      submitting.value = false
    }
  })
}

const handleImport = async () => {
  if (!importFormRef.value) return
  
  await importFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const wordList = importForm.words.split('\n').filter(w => w.trim())
      await importSensitiveWords({
        words: wordList,
        category: importForm.category,
        level: importForm.level
      })
      
      ElMessage.success(`成功导入 ${wordList.length} 个敏感词`)
      importDialogVisible.value = false
      loadSensitiveWords()
    } catch (error) {
      console.error('导入失败:', error)
    } finally {
      submitting.value = false
    }
  })
}

const handleTest = async () => {
  if (!testForm.text.trim()) {
    ElMessage.warning('请输入要测试的文本')
    return
  }
  
  loading.value = true
  try {
    const response = await testSensitiveWord(testForm.text)
    if (response.code === 200) {
      testForm.result = response.data
    }
  } catch (error) {
    console.error('测试失败:', error)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (row: SensitiveWord) => {
  try {
    await ElMessageBox.confirm('确定要删除该敏感词吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteSensitiveWord(row.id)
    ElMessage.success('删除成功')
    loadSensitiveWords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个敏感词吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await batchDeleteSensitiveWords(selectedIds.value)
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    loadSensitiveWords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

const handleToggleStatus = async (row: SensitiveWord) => {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(`确定要${action}该敏感词吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await toggleSensitiveWordStatus(row.id, newStatus)
    ElMessage.success(`${action}成功`)
    loadSensitiveWords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`${action}失败:`, error)
    }
  }
}

const handleSelectionChange = (selection: SensitiveWord[]) => {
  selectedIds.value = selection.map(item => item.id)
}

const resetForm = () => {
  Object.assign(form, {
    id: 0,
    word: '',
    category: '',
    level: 1,
    action: 'REPLACE',
    replacement: '',
    status: 1
  })
  formRef.value?.clearValidate()
}

onMounted(() => {
  loadSensitiveWords()
})
</script>

<style scoped>
.sensitive-word-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  display: flex;
  align-items: center;
}

.test-result {
  margin-top: 20px;
}

.test-result h4 {
  margin: 10px 0;
  color: #303133;
}
</style>
