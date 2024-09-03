import { useToast } from "@/components/ui/use-toast";
import { PostsPage } from "@/lib/types";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { submitPost } from "./actions";

export function useSubmitPostMutation() {
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitPost,
    onSuccess: async (newPost) => {
      // 一般来说，发新帖子后更新数据可以直接使用queryClient.invalidateQueries,将对应 字段的数据缓存清除并重新获取
      // 但是首页帖子是无限加载多个分页，直接invalidateQueries会导致所有分页数据都被清除，需要重新获取所有分页，性能开销较大
      // 这里的处理是修改帖子列表的缓存 将新帖子的数据插入整合到当前缓存的帖子数据中
      const queryFilter: QueryFilters = { queryKey: ["post-feed", "for-you"] };

      // 取消正在进行的查询请求
      await queryClient.cancelQueries(queryFilter);


      // 将新帖子插入到缓存的第一页数据中，而不需要重新获取所有分页的数据，从而提高性能。
      // 因为帖子需要在首页和个人页展示数据，所以使用sētQueriesData来疲劳更新多个查询的缓存数据
      queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>( 
        queryFilter,
        (oldData) => {
          // 第一页数据
          const firstPage = oldData?.pages[0];

          if (firstPage) {
            return {
              pageParams: oldData.pageParams,
              pages: [
                {
                  posts: [newPost, ...firstPage.posts],
                  nextCursor: firstPage.nextCursor,
                },
                ...oldData.pages.slice(1),
              ],
            };
          }
        },
      );

      // 在第一页还没加载完的时候发布帖子，上面的cancelQueries会导致第一页数据不会更新，所以需要使第一页数据失效，重新获取数据
      // invalidateQueries会使所有的查询失效，但是这里只需要使第一页的查询失效，所以使用predicate来进一步筛选要失效的查询
      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
        // 用于进一步筛选要失效的查询。它接收一个查询对象作为参数，并返回一个布尔值。
        // 可以有选择地使某些查询失效，而不是全部失效。这里只使没有数据的查询失效。
        predicate(query) {
          return !query.state.data;
        },
      });

      toast({
        description: "Post created",
      });
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Failed to post. Please try again.",
      });
    },
  });

  return mutation;
}
