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
        
        <el-button type="primary" @click="loadWords" style="margin-left: 10px">
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
        :data="words"
        v-loading="loading"
        style="margin-top: 20px"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="word" label="敏感词" width="200" />
        <el-table-column label="分类" width="100">
          <template #default="{ row }">
            <el-tag :type="getCategoryTag(row.category)">
              {{ getCategoryText(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelTag(row.level)">
              {{ getLevelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理方式" width="120">
          <template #default="{ row }">
            {{ getActionText(row.action) }}
          </template>
        </el-table-column>
        <el-table-column prop="replacement" label="替换词" width="150" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
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
        @size-change="loadWords"
        @current-change="loadWords"
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
        <el-button type="primary" @click="handleImport" :loading="importing">
          导入
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 测试对话框 -->
    <el-dialog v-model="testDialogVisible" title="测试敏感词" width="600px">
      <el-input
        v-model="testText"
        type="textarea"
        :rows="6"
        placeholder="输入要测试的文本"
      />
      
      <div v-if="testResult" class="test-result">
        <el-divider />
        <h4>检测结果:</h4>
        <p v-if="testResult.hasSensitiveWords" style="color: #f56c6c;">
          检测到 {{ testResult.words?.length || 0 }} 个敏感词
        </p>
        <p v-else style="color: #67c23a;">未检测到敏感词</p>
        
        <div v-if="testResult.words && testResult.words.length > 0">
          <el-tag
            v-for="(word, index) in testResult.words"
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
        <el-button type="primary" @click="handleTest" :loading="testing">
          测试
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Upload } from '@element-plus/icons-vue'
import {
  getSensitiveWordList,
  createSensitiveWord,
  updateSensitiveWord,
  deleteSensitiveWord,
  batchDeleteSensitiveWords,
  importSensitiveWords,
  toggleSensitiveWordStatus,
  testSensitiveWords,
  type SensitiveWord
} from '@/api/sensitive'

const loading = ref(false)
const submitting = ref(false)
const importing = ref(false)
const testing = ref(false)
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const testDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const words = ref<SensitiveWord[]>([])
const selectedIds = ref<number[]>([])
const testText = ref('')
const testResult = ref<any>(null)

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
  category: 'OTHER',
  level: 1,
  action: 'REPLACE',
  replacement: '***'
})

const importForm = reactive({
  words: '',
  category: 'OTHER',
  level: 1
})

const formRules: FormRules = {
  word: [{ required: true, message: '请输入敏感词', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  level: [{ required: true, message: '请选择级别', trigger: 'change' }],
  action: [{ required: true, message: '请选择处理方式', trigger: 'change' }]
}

const getCategoryTag = (category: string) => {
  const map: Record<string, string> = {
    PROFANITY: 'danger',
    POLITICAL: 'warning',
    VIOLENCE: 'danger',
    OTHER: 'info'
  }
  return map[category] || 'info'
}

const getCategoryText = (category: string) => {
  const map: Record<string, string> = {
    PROFANITY: '脏话',
    POLITICAL: '政治',
    VIOLENCE: '暴力',
    OTHER: '其他'
  }
  return map[category] || category
}

const getLevelTag = (level: number) => {
  const map: Record<number, string> = {
    1: 'success',
    2: 'warning',
    3: 'danger'
  }
  return map[level] || 'info'
}

const getLevelText = (level: number) => {
  const map: Record<number, string> = {
    1: '轻度',
    2: '中度',
    3: '严重'
  }
  return map[level] || String(level)
}

const getActionText = (action: string) => {
  const map: Record<string, string> = {
    REPLACE: '替换',
    BLOCK: '屏蔽',
    WARN: '警告'
  }
  return map[action] || action
}

const loadWords = async () => {
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
      words.value = response.data.list || []
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
  importForm.category = 'OTHER'
  importForm.level = 1
  importDialogVisible.value = true
}

const showTestDialog = () => {
  testText.value = ''
  testResult.value = null
  testDialogVisible.value = true
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
      loadWords()
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      submitting.value = false
    }
  })
}

const handleImport = async () => {
  if (!importForm.words.trim()) {
    ElMessage.warning('请输入敏感词')
    return
  }
  
  importing.value = true
  try {
    const wordList = importForm.words.split('\n').filter(w => w.trim())
    await importSensitiveWords({
      words: wordList,
      category: importForm.category,
      level: importForm.level
    })
    
    ElMessage.success(`成功导入 ${wordList.length} 个敏感词`)
    importDialogVisible.value = false
    loadWords()
  } catch (error) {
    console.error('导入失败:', error)
  } finally {
    importing.value = false
  }
}

const handleTest = async () => {
  if (!testText.value.trim()) {
    ElMessage.warning('请输入要测试的文本')
    return
  }
  
  testing.value = true
  try {
    const response = await testSensitiveWords(testText.value)
    testResult.value = response.data
  } catch (error) {
    console.error('测试失败:', error)
  } finally {
    testing.value = false
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
    loadWords()
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
    loadWords()
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
    await toggleSensitiveWordStatus(row.id, newStatus)
    ElMessage.success(`${action}成功`)
    loadWords()
  } catch (error) {
    console.error(`${action}失败:`, error)
  }
}

const handleSelectionChange = (selection: SensitiveWord[]) => {
  selectedIds.value = selection.map(item => item.id)
}

const resetForm = () => {
  Object.assign(form, {
    id: 0,
    word: '',
    category: 'OTHER',
    level: 1,
    action: 'REPLACE',
    replacement: '***'
  })
  formRef.value?.clearValidate()
}

onMounted(() => {
  loadWords()
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
