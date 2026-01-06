import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { addComment, deleteComment } from '@/api/comment.js';
import { useUserInfo } from '@/stores/user.js';
import { checkCoursePermission } from '@/api/course.js';

export function useCommentItem(props, emit) {
    // 状态
    const showReply = ref(false);
    const replyContent = ref('');
    const isReplying = ref(false);
    const defaultAvatar = 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9636ef921315944d5671d8.png';

    // 用户信息
    const userInfoStore = useUserInfo();
    userInfoStore.initUserInfo();
    const currentUserId = computed(() => {
        return userInfoStore.userId || localStorage.getItem('studentId') || localStorage.getItem('s_id') || localStorage.getItem('teacherId') || localStorage.getItem('t_id');
    });

    // 检查是否可以删除（自己发布的评论 或 课程教师）
    const canDeleteComment = async (courseId) => {
        if (userInfoStore.userType === 'ADMIN') return true; // 管理员可以删除一切
        if (props.comment.userId === currentUserId.value) return true; // 自己的评论

        try {
            const res = await checkCoursePermission(courseId, currentUserId.value);
            return res.success && res.data.isOwner; // 课程拥有者可以删除
        } catch {
            return false;
        }
    };

    // 切换回复表单
    const toggleReplyForm = () => {
        showReply.value = !showReply.value;
        replyContent.value = '';
    };

    // 提交回复
    const submitReply = async () => {
        if (!replyContent.value.trim()) return ElMessage.warning('回复内容不能为空');
        if (!currentUserId.value) return ElMessage.error('请登录后发表回复');

        isReplying.value = true;
        try {
            const commentData = {
                courseId: props.courseId,
                chapterId: props.comment.chapterId || null, // Inherit chapterId from parent
                userId: currentUserId.value,
                userName: userInfoStore.userName || localStorage.getItem('userName') || localStorage.getItem('studentName') || '匿名用户',
                userType: userInfoStore.userType || (localStorage.getItem('studentId') ? 'STUDENT' : 'TEACHER'),
                userAvatar: userInfoStore.avatarUrl || defaultAvatar,
                content: replyContent.value,
                parentId: props.comment.commentId || props.comment.id,
                targetUserId: props.comment.userId,
                targetUserName: props.comment.userName,
            };

            const res = await addComment(commentData);
            if (res.code === 200) {
                ElMessage.success('回复成功！');
                showReply.value = false;
                replyContent.value = '';
                emit('commentPosted'); // 通知父组件刷新列表
            } else {
                ElMessage.error(res.message || '回复失败');
            }
        } catch (error) {
            ElMessage.error('回复失败: ' + (error.message || '网络错误'));
        } finally {
            isReplying.value = false;
        }
    };

    // 删除评论
    const confirmDelete = (commentId) => {
        const actualId = commentId || props.comment.commentId || props.comment.id;

        ElMessageBox.confirm('确定要删除这条评论吗？删除后将无法恢复！', '警告', {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
        }).then(async () => {
            // 再次确认权限 (Skip complex async check in UI for responsiveness, server will validate)
            // if (!(await canDeleteComment(props.courseId))) { ... } 

            try {
                const res = await deleteComment(actualId);
                if (res.code === 200) {
                    ElMessage.success('评论删除成功');
                    emit('commentPosted'); // 通知父组件刷新列表
                } else {
                    ElMessage.error(res.message || '删除失败');
                }
            } catch (error) {
                ElMessage.error('删除失败: ' + (error.message || '网络错误'));
            }
        }).catch(() => { });
    };

    return {
        showReply,
        replyContent,
        isReplying,
        defaultAvatar,
        currentUserId,
        canDeleteComment,
        toggleReplyForm,
        submitReply,
        confirmDelete
    };
}
