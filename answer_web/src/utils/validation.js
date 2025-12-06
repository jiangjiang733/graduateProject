/**
 * 表单验证工具函数
 * 提供常用的表单验证规则和验证器
 */

/**
 * 必填验证
 * @param {string} message - 错误提示信息
 * @returns {object} 验证规则
 */
export function required(message = '此项为必填项') {
  return {
    required: true,
    message: message,
    trigger: 'blur',
  }
}

/**
 * 邮箱验证
 * @param {boolean} isRequired - 是否必填
 * @returns {object} 验证规则
 */
export function email(isRequired = true) {
  const rules = [
    {
      type: 'email',
      message: '请输入正确的邮箱地址',
      trigger: 'blur',
    },
  ]
  
  if (isRequired) {
    rules.unshift(required('请输入邮箱地址'))
  }
  
  return rules
}

/**
 * 手机号验证
 * @param {boolean} isRequired - 是否必填
 * @returns {object} 验证规则
 */
export function phone(isRequired = true) {
  const rules = [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号码',
      trigger: 'blur',
    },
  ]
  
  if (isRequired) {
    rules.unshift(required('请输入手机号码'))
  }
  
  return rules
}

/**
 * 密码验证
 * @param {number} minLength - 最小长度
 * @param {number} maxLength - 最大长度
 * @returns {object} 验证规则
 */
export function password(minLength = 6, maxLength = 20) {
  return [
    required('请输入密码'),
    {
      min: minLength,
      max: maxLength,
      message: `密码长度应在 ${minLength} 到 ${maxLength} 个字符之间`,
      trigger: 'blur',
    },
    {
      pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]/,
      message: '密码必须包含字母和数字',
      trigger: 'blur',
    },
  ]
}

/**
 * 确认密码验证
 * @param {Function} getPassword - 获取原密码的函数
 * @returns {object} 验证规则
 */
export function confirmPassword(getPassword) {
  return [
    required('请再次输入密码'),
    {
      validator: (rule, value, callback) => {
        if (value !== getPassword()) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ]
}

/**
 * 用户名验证
 * @param {number} minLength - 最小长度
 * @param {number} maxLength - 最大长度
 * @returns {object} 验证规则
 */
export function username(minLength = 3, maxLength = 20) {
  return [
    required('请输入用户名'),
    {
      min: minLength,
      max: maxLength,
      message: `用户名长度应在 ${minLength} 到 ${maxLength} 个字符之间`,
      trigger: 'blur',
    },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: '用户名只能包含字母、数字和下划线',
      trigger: 'blur',
    },
  ]
}

/**
 * 长度验证
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 * @param {string} message - 错误提示信息
 * @returns {object} 验证规则
 */
export function length(min, max, message = null) {
  return {
    min: min,
    max: max,
    message: message || `长度应在 ${min} 到 ${max} 个字符之间`,
    trigger: 'blur',
  }
}

/**
 * 最小长度验证
 * @param {number} min - 最小长度
 * @param {string} message - 错误提示信息
 * @returns {object} 验证规则
 */
export function minLength(min, message = null) {
  return {
    min: min,
    message: message || `长度不能少于 ${min} 个字符`,
    trigger: 'blur',
  }
}

/**
 * 最大长度验证
 * @param {number} max - 最大长度
 * @param {string} message - 错误提示信息
 * @returns {object} 验证规则
 */
export function maxLength(max, message = null) {
  return {
    max: max,
    message: message || `长度不能超过 ${max} 个字符`,
    trigger: 'blur',
  }
}

/**
 * 数字验证
 * @param {boolean} isRequired - 是否必填
 * @returns {object} 验证规则
 */
export function number(isRequired = true) {
  const rules = [
    {
      type: 'number',
      message: '请输入数字',
      trigger: 'blur',
    },
  ]
  
  if (isRequired) {
    rules.unshift(required('请输入数字'))
  }
  
  return rules
}

/**
 * 整数验证
 * @param {boolean} isRequired - 是否必填
 * @returns {object} 验证规则
 */
export function integer(isRequired = true) {
  const rules = [
    {
      type: 'integer',
      message: '请输入整数',
      trigger: 'blur',
    },
  ]
  
  if (isRequired) {
    rules.unshift(required('请输入整数'))
  }
  
  return rules
}

/**
 * 范围验证
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {string} message - 错误提示信息
 * @returns {object} 验证规则
 */
export function range(min, max, message = null) {
  return {
    type: 'number',
    min: min,
    max: max,
    message: message || `值应在 ${min} 到 ${max} 之间`,
    trigger: 'blur',
  }
}

/**
 * URL验证
 * @param {boolean} isRequired - 是否必填
 * @returns {object} 验证规则
 */
export function url(isRequired = true) {
  const rules = [
    {
      type: 'url',
      message: '请输入正确的URL地址',
      trigger: 'blur',
    },
  ]
  
  if (isRequired) {
    rules.unshift(required('请输入URL地址'))
  }
  
  return rules
}

/**
 * 日期验证
 * @param {boolean} isRequired - 是否必填
 * @returns {object} 验证规则
 */
export function date(isRequired = true) {
  const rules = [
    {
      type: 'date',
      message: '请选择日期',
      trigger: 'change',
    },
  ]
  
  if (isRequired) {
    rules.unshift({
      required: true,
      message: '请选择日期',
      trigger: 'change',
    })
  }
  
  return rules
}

/**
 * 自定义正则验证
 * @param {RegExp} pattern - 正则表达式
 * @param {string} message - 错误提示信息
 * @param {boolean} isRequired - 是否必填
 * @returns {object} 验证规则
 */
export function pattern(pattern, message, isRequired = true) {
  const rules = [
    {
      pattern: pattern,
      message: message,
      trigger: 'blur',
    },
  ]
  
  if (isRequired) {
    rules.unshift(required())
  }
  
  return rules
}

/**
 * 自定义验证器
 * @param {Function} validator - 验证函数
 * @param {boolean} isRequired - 是否必填
 * @returns {object} 验证规则
 */
export function custom(validator, isRequired = true) {
  const rules = [
    {
      validator: validator,
      trigger: 'blur',
    },
  ]
  
  if (isRequired) {
    rules.unshift(required())
  }
  
  return rules
}

/**
 * 身份证号验证
 * @param {boolean} isRequired - 是否必填
 * @returns {object} 验证规则
 */
export function idCard(isRequired = true) {
  const rules = [
    {
      pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
      message: '请输入正确的身份证号码',
      trigger: 'blur',
    },
  ]
  
  if (isRequired) {
    rules.unshift(required('请输入身份证号码'))
  }
  
  return rules
}

/**
 * 中文验证
 * @param {boolean} isRequired - 是否必填
 * @returns {object} 验证规则
 */
export function chinese(isRequired = true) {
  const rules = [
    {
      pattern: /^[\u4e00-\u9fa5]+$/,
      message: '请输入中文',
      trigger: 'blur',
    },
  ]
  
  if (isRequired) {
    rules.unshift(required('请输入中文'))
  }
  
  return rules
}

/**
 * 英文验证
 * @param {boolean} isRequired - 是否必填
 * @returns {object} 验证规则
 */
export function english(isRequired = true) {
  const rules = [
    {
      pattern: /^[a-zA-Z]+$/,
      message: '请输入英文',
      trigger: 'blur',
    },
  ]
  
  if (isRequired) {
    rules.unshift(required('请输入英文'))
  }
  
  return rules
}

/**
 * 文件大小验证
 * @param {number} maxSize - 最大文件大小（MB）
 * @returns {Function} 验证函数
 */
export function fileSize(maxSize) {
  return (file) => {
    const isLt = file.size / 1024 / 1024 < maxSize
    if (!isLt) {
      return `文件大小不能超过 ${maxSize}MB`
    }
    return true
  }
}

/**
 * 文件类型验证
 * @param {Array} types - 允许的文件类型数组
 * @returns {Function} 验证函数
 */
export function fileType(types) {
  return (file) => {
    const fileType = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase()
    const isValidType = types.includes(fileType)
    if (!isValidType) {
      return `只能上传 ${types.join('、')} 格式的文件`
    }
    return true
  }
}

/**
 * 图片文件验证
 * @param {number} maxSize - 最大文件大小（MB）
 * @returns {Function} 验证函数
 */
export function imageFile(maxSize = 5) {
  return (file) => {
    const typeResult = fileType(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'])(file)
    if (typeResult !== true) {
      return typeResult
    }
    return fileSize(maxSize)(file)
  }
}

/**
 * 视频文件验证
 * @param {number} maxSize - 最大文件大小（MB）
 * @returns {Function} 验证函数
 */
export function videoFile(maxSize = 100) {
  return (file) => {
    const typeResult = fileType(['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'])(file)
    if (typeResult !== true) {
      return typeResult
    }
    return fileSize(maxSize)(file)
  }
}

/**
 * 文档文件验证
 * @param {number} maxSize - 最大文件大小（MB）
 * @returns {Function} 验证函数
 */
export function documentFile(maxSize = 10) {
  return (file) => {
    const typeResult = fileType(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'])(file)
    if (typeResult !== true) {
      return typeResult
    }
    return fileSize(maxSize)(file)
  }
}

export default {
  required,
  email,
  phone,
  password,
  confirmPassword,
  username,
  length,
  minLength,
  maxLength,
  number,
  integer,
  range,
  url,
  date,
  pattern,
  custom,
  idCard,
  chinese,
  english,
  fileSize,
  fileType,
  imageFile,
  videoFile,
  documentFile,
}
