import {
  createSlice,
  createAsyncThunk,
  createSelector,
  createEntityAdapter
 } from '@reduxjs/toolkit'
import { client } from '../../api/client'

const postsAdapter = createEntityAdapter({
  sortComparer: (a, b) => b.date.localeCompare(a.date)
})

const initialState = postsAdapter.getInitialState ({
    status: 'idle',
    error: null
})

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async () => {
    const response = await client.get('/fakeApi/posts')
    return response.posts
})

export const addNewPost = createAsyncThunk(
  'posts/addNewPost',
  async (initialPost) => {
    const response = await client.post('/fakeApi/posts', { post: initialPost })
    return response.post
  }
)

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    reactionAdded(state, action) {
      const { postId, reaction } = action.payload
      const existingPost = state.entities[postId]
      if (existingPost) {
        existingPost.reactions[reaction]++
      }
    },
    postUpdated(state, action) {
      const { id, title, content } = action.payload
      const existingPost = state.entities[id]
      if (existingPost) {
        existingPost.title = title
        existingPost.content = content
      }
    },
  },
  extraReducers: {
      [fetchPosts.pending]: (state, action) => {
          state.status = 'loading'
      },
      [fetchPosts.fulfilled]: (state, action) => {
          state.status = 'succeeded'
          // state.posts = state.posts.concat(action.payload)
          postsAdapter.upsertMany(state, action.payload)
      },
      [fetchPosts.rejected]: (state, action) => {
          state.status = 'failed'
          state.error = action.payload
      },
      [addNewPost.fulfilled]: postsAdapter.addOne
  },
})

export const { postUpdated, reactionAdded } = postsSlice.actions

export default postsSlice.reducer

export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds
} = postsAdapter.getSelectors(state => state.posts)

// メモ化。前後の入力値を保持し、変更がない場合は再計算せずに値をそのまま返す。useSelectorだと無条件に再計算してしまう。
export const selectPostByUser = createSelector(
  [selectAllPosts, (state, userId) => userId],
  (posts, userId) => posts.filter(post => post.user === userId)
)
