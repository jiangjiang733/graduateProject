import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { addComment, getCourseComments, getChapterComments } from '@/api/comment.js';
import { useUserInfo } from '@/stores/user.js';

export function useCourseComment(props) {
    const route = useRoute();
    // 状态
    const comments = ref([]);
    const commentContent = ref('');
    const isPosting = ref(false);
    const loadingComments = ref(true);
    const selectedChapterId = ref(''); // 当前选中的章节ID
    const searchKeyword = ref(''); // 搜索关键词

    // 用户信息获取
    const userInfoStore = useUserInfo();

    // 初始化用户信息
    userInfoStore.initUserInfo();

    const currentUserId = computed(() => userInfoStore.userId);
    const currentUserName = computed(() => userInfoStore.userName || '匿名用户');
    const userAvatar = computed(() => userInfoStore.avatarUrl);

    // 工具函数：将平铺列表转换为树形结构（以适应回复层级）
    // 工具函数：将平铺列表转换为树形结构，并将所有子评论平铺到根评论的 replies 中
    const buildCommentTree = (list) => {
        const map = {};
        const roots = [];
        const childrenMap = {};

        // 1. 初始化 map 和 childrenMap
        list.forEach(item => {
            // 重置 replies，防止重复累加
            item.replies = [];

            // 确保使用 String 类型 key
            const id = String(item.commentId || item.id);
            map[id] = item;

            const pid = item.parentId ? String(item.parentId) : null;
            if (pid) {
                if (!childrenMap[pid]) childrenMap[pid] = [];
                childrenMap[pid].push(item);
            } else {
                roots.push(item);
            }
        });

        // 2. 为每个根节点收集所有后代（平铺）
        roots.forEach(root => {
            const allReplies = [];
            // 使用队列进行广度优先遍历查找所有后代
            const rootId = String(root.commentId || root.id);
            const queue = [...(childrenMap[rootId] || [])];

            while (queue.length > 0) {
                const node = queue.shift();

                // 确保 targetUserName 存在，如果接口未返回但有 parentId，尝试从本地 map 获取
                if (!node.targetUserName && node.parentId) {
                    const parent = map[String(node.parentId)];
                    if (parent) {
                        node.targetUserName = parent.userName;
                        node.targetUserId = parent.userId;
                    }
                }

                allReplies.push(node);

                // 将该节点的直接子节点加入队列
                const nodeId = String(node.commentId || node.id);
                if (childrenMap[nodeId]) {
                    queue.push(...childrenMap[nodeId]);
                }
            }

            // 按时间正序排序（旧的在前）
            allReplies.sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());

            root.replies = allReplies;
        });

        return roots;
    };

    // 过滤评论
    const filteredComments = computed(() => {
        if (!searchKeyword.value) return comments.value;
        const keyword = searchKeyword.value.toLowerCase();

        const filterTree = (nodes) => {
            return nodes.reduce((acc, node) => {
                const matchSelf = node.content && node.content.toLowerCase().includes(keyword);
                const filteredReplies = node.replies ? filterTree(node.replies) : [];

                // 如果自己匹配或者子回复中有匹配，则保留该节点
                if (matchSelf || filteredReplies.length > 0) {
                    // 创建副本以避免修改原始数据，但保留匹配的回复
                    acc.push({
                        ...node,
                        replies: filteredReplies // 只显示匹配的回复（或者你可以选择显示所有回复，取决于需求，这里只显示匹配路径更清晰）
                    });
                }
                return acc;
            }, []);
        };

        return filterTree(comments.value);
    });

    // 获取评论列表
    const fetchComments = async () => {
        loadingComments.value = true;
        try {
            let res;
            if (selectedChapterId.value) {
                // 如果选中了特定章节，则获取章节评论
                res = await getChapterComments(selectedChapterId.value);
            } else {
                // 否则获取整个课程的评论
                res = await getCourseComments(props.courseId);
            }

            if (res.code === 200 && res.data) {
                comments.value = buildCommentTree(res.data);

                // 检查是否有 commentId 需要定位
                const targetCommentId = route.query.commentId;
                if (targetCommentId) {
                    nextTick(() => {
                        setTimeout(() => {
                            const element = document.getElementById(`comment-${targetCommentId}`);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 500);
                    });
                }
            } else {
                comments.value = [];
            }
        } catch (error) {
            console.error('加载评论失败', error);
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
                chapterId: selectedChapterId.value || null, // 发布时也可以关联当前选中的章节
                userId: currentUserId.value,
                userName: currentUserName.value,
                userType: 'TEACHER', // 明确是老师发表
                userAvatar: userAvatar.value, // Add avatar
                content: commentContent.value,
                parentId: parentId,
            };

            const res = await addComment(commentData);
            if (res.code === 200) {
                ElMessage.success(parentId ? '回复成功！' : '评论发布成功！');
                commentContent.value = '';
                await fetchComments();
            } else {
                ElMessage.error(res.message || '发布失败');
            }
        } catch (error) {
            ElMessage.error('发布失败');
        } finally {
            isPosting.value = false;
        }
    };

    onMounted(() => {
        fetchComments();
    });

    return {
        comments: filteredComments, // Return filtered comments as 'comments' for UI transparency or use separate ref
        rawComments: comments,
        searchKeyword,
        commentContent,
        selectedChapterId,
        isPosting,
        loadingComments,
        userAvatar,
        fetchComments,
        submitComment
    };
}
