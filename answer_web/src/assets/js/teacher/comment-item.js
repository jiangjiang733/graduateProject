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
    const currentUserId = computed(() => userInfoStore.userId);

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
                userId: currentUserId.value,
                userName: userInfoStore.userName,
                userType: userInfoStore.userType,
                content: replyContent.value,
                parentId: props.comment.id || props.comment.commentId, // 回复当前评论
                targetUserId: props.comment.userId, // 被回复人ID
                targetUserName: props.comment.userName, // 被回复人名称
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
        ElMessageBox.confirm('确定要删除这条评论吗？删除后将无法恢复！', '警告', {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
        }).then(async () => {
            // 再次确认权限
            if (!(await canDeleteComment(props.courseId))) {
                return ElMessage.error('您没有权限删除此评论。');
            }

            try {
                const res = await deleteComment(commentId);
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
