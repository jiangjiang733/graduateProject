import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { addComment, getCourseComments } from '@/api/comment.js';
import { useUserInfo } from '@/stores/user.js';

export function useCourseComment(props) {
    // 状态
    const comments = ref([]);
    const commentContent = ref('');
    const isPosting = ref(false);
    const loadingComments = ref(true);

    // 用户信息获取
    const userInfoStore = useUserInfo();

    // 初始化用户信息
    userInfoStore.initUserInfo();

    const currentUserId = computed(() => userInfoStore.userId);
    const currentUserName = computed(() => userInfoStore.userName || '匿名用户');
    const userAvatar = computed(() => userInfoStore.avatarUrl);

    // 工具函数：将平铺列表转换为树形结构（以适应回复层级）
    const buildCommentTree = (list) => {
        const map = {};
        const tree = [];

        // 初始化 map，并处理数据
        list.forEach(item => {
            map[item.id] = item;
            // 假设后端没有返回 replies 字段，我们自己初始化
            item.replies = item.replies || [];
        });

        // 构建树形结构
        list.forEach(item => {
            // 检查 parentId 是否有效且不是它自己
            if (item.parentId && map[item.parentId] && item.parentId !== item.id) {
                map[item.parentId].replies.push(item);
            } else {
                tree.push(item);
            }
        });
        // 确保一级评论按时间倒序排列 (如果需要)
        // tree.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
        return tree;
    };

    // 获取评论列表
    const fetchComments = async () => {
        loadingComments.value = true;
        try {
            const res = await getCourseComments(props.courseId);
            if (res.code === 200 && res.data) {
                // 假设后端返回的是平铺列表，需要前端构建树形结构
                comments.value = buildCommentTree(res.data);
            } else {
                ElMessage.error(res.message || '加载评论失败');
                comments.value = [];
            }
        } catch (error) {
            ElMessage.error('加载评论失败');
        } finally {
            loadingComments.value = false;
        }
    };

    // 提交评论
    const submitComment = async (parentId) => {
        if (!commentContent.value.trim()) return ElMessage.warning('评论内容不能为空');
        if (!currentUserId.value) return ElMessage.error('请登录后发表评论');

        isPosting.value = true;
        try {
            const commentData = {
                courseId: props.courseId,
                userId: currentUserId.value,
                userName: currentUserName.value,
                userType: userInfoStore.userType,
                content: commentContent.value,
                parentId: parentId, // 评论或回复
            };

            const res = await addComment(commentData);
            if (res.code === 200) {
                ElMessage.success(parentId ? '回复成功！' : '评论发布成功！');
                commentContent.value = ''; // 清空输入框
                await fetchComments();
            } else {
                ElMessage.error(res.message || '发布失败');
            }
        } catch (error) {
            ElMessage.error('发布失败: ' + (error.message || '网络错误'));
        } finally {
            isPosting.value = false;
        }
    };

    onMounted(() => {
        fetchComments();
    });

    return {
        comments,
        commentContent,
        isPosting,
        loadingComments,
        userAvatar,
        fetchComments,
        submitComment
    };
}
