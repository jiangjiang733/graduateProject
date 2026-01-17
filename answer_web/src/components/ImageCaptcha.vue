<template>
  <div class="captcha-container" @click="refreshCaptcha" title="点击刷新验证码">
    <canvas ref="canvasRef" :width="width" :height="height"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, defineExpose } from 'vue'

const props = defineProps({
  width: {
    type: Number,
    default: 120
  },
  height: {
    type: Number,
    default: 40
  }
})

const canvasRef = ref(null)
const captchaCode = ref('')

// 生成随机颜色
const randomColor = (min, max) => {
  const r = Math.floor(Math.random() * (max - min) + min)
  const g = Math.floor(Math.random() * (max - min) + min)
  const b = Math.floor(Math.random() * (max - min) + min)
  return `rgb(${r},${g},${b})`
}

// 生成验证码
const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  captchaCode.value = code
  return code
}

// 绘制验证码
const drawCaptcha = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const code = generateCaptcha()

  // 背景
  ctx.fillStyle = randomColor(180, 230)
  ctx.fillRect(0, 0, props.width, props.height)

  // 绘制干扰线
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = randomColor(100, 200)
    ctx.beginPath()
    ctx.moveTo(Math.random() * props.width, Math.random() * props.height)
    ctx.lineTo(Math.random() * props.width, Math.random() * props.height)
    ctx.stroke()
  }

  // 绘制验证码文字
  for (let i = 0; i < code.length; i++) {
    ctx.fillStyle = randomColor(50, 160)
    ctx.font = `bold ${20 + Math.random() * 10}px Arial`
    const x = (props.width / 5) * (i + 0.5)
    const y = props.height / 2 + Math.random() * 10
    const angle = (Math.random() - 0.5) * 0.5
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.fillText(code[i], 0, 0)
    ctx.restore()
  }

  // 绘制干扰点
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = randomColor(0, 255)
    ctx.beginPath()
    ctx.arc(Math.random() * props.width, Math.random() * props.height, 1, 0, 2 * Math.PI)
    ctx.fill()
  }
}

// 刷新验证码
const refreshCaptcha = () => {
  drawCaptcha()
}

// 验证码验证
const validate = (inputCode) => {
  return inputCode.toLowerCase() === captchaCode.value.toLowerCase()
}

// 获取验证码值
const getCaptchaCode = () => {
  return captchaCode.value
}

onMounted(() => {
  drawCaptcha()
})

defineExpose({
  refreshCaptcha,
  validate,
  getCaptchaCode
})
</script>

<style scoped>
.captcha-container {
  display: inline-block;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  transition: transform 0.2s;
}

.captcha-container:hover {
  transform: scale(1.05);
}

canvas {
  display: block;
}
</style>
