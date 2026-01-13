<template>
  <div class="management-container modern-page">
    <el-row :gutter="24">
      <!-- 左侧：词库管理 -->
      <el-col :span="16">
        <el-card class="content-card table-card">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon color="#f43f5e"><Warning /></el-icon>
                <span>内容安全过滤引擎</span>
              </div>
              <el-button type="danger" class="btn-rounded" @click="showAddDialog">
                <el-icon><Plus /></el-icon> 添加拦截词
              </el-button>
            </div>
          </template>
          
          <div class="search-toolbar">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索拦截词..."
              class="modern-input"
              style="width: 240px"
              clearable
              @keyup.enter="loadSensitiveWords"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            
            <el-select v-model="searchForm.category" placeholder="风险类别" clearable style="width: 150px; margin-left:12px" @change="loadSensitiveWords">
                <el-option label="政治敏感" value="POLITICS" />
                <el-option label="违禁信息" value="PROHIBITED" />
                <el-option label="色情低俗" value="PORN" />
                <el-option label="其他类别" value="OTHER" />
            </el-select>

            <div style="flex: 1"></div>
            
            <el-button
              type="danger"
              plain
              class="btn-rounded"
              :disabled="selectedIds.length === 0"
              @click="handleBatchDelete"
            >
              批量删除
            </el-button>
          </div>
          
          <el-table
            :data="sensitiveWords"
            v-loading="loading"
            class="modern-table"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="word" label="过滤词项" min-width="150" />
            <el-table-column prop="category" label="风险类别" width="120">
              <template #default="{ row }">
                <el-tag size="small" effect="dark" :type="row.category === 'POLITICS' ? 'danger' : 'warning'">
                    {{ row.category === 'POLITICS' ? '政治敏感' : (row.category === 'PORN' ? '色情低俗' : '其他违规') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="action" label="拦截策略" width="120">
              <template #default="{ row }">
                <el-tag size="small" :type="row.action === 'BLOCK' ? 'danger' : 'info'">
                  {{ row.action === 'BLOCK' ? '完全拦截' : (row.action === 'REPLACE' ? '自动掩码' : '人工审核') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <div class="action-btns">
                  <el-button size="small" link type="primary" @click="handleEdit(row)">档案</el-button>
                  <el-button size="small" link type="danger" @click="handleDelete(row)">移除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.pageNumber"
              v-model:page-size="pagination.pageSize"
              :total="pagination.total"
              layout="total, prev, pager, next"
              background
              @current-change="loadSensitiveWords"
            />
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧：测试区域 -->
      <el-col :span="8">
        <el-card class="content-card">
          <template #header>
            <div class="header-title">
              <el-icon color="#3b82f6"><Odometer /></el-icon>
              <span>模拟盾牌测试</span>
            </div>
          </template>
          
          <el-form class="modern-form" label-position="top">
            <el-form-item label="待检测文本">
              <el-input
                v-model="testForm.text"
                type="textarea"
                :rows="6"
                placeholder="在此输入文本，验证过滤引擎是否生效..."
              />
            </el-form-item>
            
            <el-button type="primary" block style="width: 100%" @click="handleTest" :loading="loading">
              快速扫描分析
            </el-button>
            
            <div v-if="testForm.result" style="margin-top: 24px;">
              <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px; color: #64748b;">深度扫描结果：</div>
              <div style="padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; line-height: 1.6; color: #1e293b; font-family: 'JetBrains Mono', monospace;">
                {{ testForm.result }}
              </div>
            </div>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 维护对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '修正拦截策略' : '收录安全黑名单词条'"
      width="450px"
      class="modern-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-position="top"
        class="modern-form"
      >
        <el-form-item label="黑名单关键词" prop="word">
          <el-input v-model="form.word" placeholder="输入需要检测的关键词汇" />
        </el-form-item>
        
        <el-form-item label="风险分级" prop="level">
           <el-rate v-model="form.level" :max="3" :texts="['轻微', '中等', '严厉']" show-text />
        </el-form-item>

        <el-form-item label="所属业务分类" prop="category">
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="政治敏感" value="POLITICS" />
            <el-option label="色情低俗" value="PORN" />
            <el-option label="暴力恐怖" value="VIOLENCE" />
            <el-option label="垃圾广告" value="SPAM" />
            <el-option label="其他违规" value="OTHER" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="执行动作" prop="action">
          <el-radio-group v-model="form.action">
            <el-radio label="BLOCK">直接拦截 (拒绝发布)</el-radio>
            <el-radio label="REPLACE">掩码处理 (替换关键词)</el-radio>
            <el-radio label="REVIEW">标记异常 (进入人工审核)</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="替换占位符" prop="replacement" v-if="form.action === 'REPLACE'">
          <el-input v-model="form.replacement" placeholder="默认：***" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div style="padding-top: 10px">
          <el-button @click="dialogVisible = false" class="btn-rounded">取消</el-button>
          <el-button type="danger" @click="handleSubmit" :loading="submitting" class="btn-rounded">
            立即同步词库
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Plus, Search, Warning, Odometer } from '@element-plus/icons-vue'
import { useSensitiveWordManagement } from '@/assets/js/sensitive-word-management'

const {
  loading,
  submitting,
  dialogVisible,
  isEdit,
  formRef,
  sensitiveWords,
  selectedIds,
  testForm,
  searchForm,
  pagination,
  form,
  formRules,
  loadSensitiveWords,
  handleTest,
  showAddDialog,
  handleEdit,
  handleSubmit,
  handleDelete,
  handleBatchDelete,
  handleSelectionChange
} = useSensitiveWordManagement()

onMounted(() => {
  loadSensitiveWords()
})
</script>

<style scoped>
@import '@/assets/css/variables.css';
@import '@/assets/css/content-management.css';
@import '@/assets/css/user-management.css';
</style>
