// import React from 'react';
// import { RefreshControl, View } from 'react-native';

// import { useNavigation } from '@react-navigation/native';
// import MasonryList from 'react-native-masonry-list';

// import {
//   EmptyTabView,
//   ErrorTabView,
//   LoadingTabView,
// } from '../../components';
// import { colors, values } from '../../constants';

// const imagePlaceholder = require('../../../resources/images/imagePlaceholder.png');

// const Parse = require('parse/react-native');

// async function fetchPosts(noteDetails) {
//   const Board = Parse.Object.extend('Board');
//   const boardPointer = new Board();
//   boardPointer.id = noteDetails.id;

//   const pinnedPostRelation = boardPointer.relation('pinnedEnjaga');
//   const query = pinnedPostRelation.query();
//   const results = await query.find();
//   return results.map((post) => {
//     let postType = PostItemKind.MEDIA; // default value

//     const media = post.get('media');
//     if (Array.isArray(media) && media.length) {
//       media.forEach(({ type }, i) => {
//         if (type === 'video') media[i].isVideo = true;
//       });
//     }

//     const imagePreview =
//       (Array.isArray(media) && media.length && media[0]) ?? null;
//     const imagePreviewUrl = imagePreview?.url;

//     const imagePreviewDimensions = {
//       width: imagePreview?.width ?? 800,
//       height: imagePreview?.height ?? 600,
//     };

//     if (!imagePreviewUrl) postType = PostItemKind.TEXT;

//     // We use a placeholder for now if it is a text post
//     const imagePreviewSource = imagePreviewUrl
//       ? { uri: imagePreviewUrl }
//       : imagePlaceholder;

//     let likesCount = 0;
//     let hasLiked = false;
//     const likersArray = post.get('likersArray');
//     // if (Array.isArray(likersArray) && likersArray.length) {
//     //   likesCount = likersArray.length;
//     //   hasLiked = likersArray.some((liker) => profileId === liker);
//     // }

//     return {
//       author: {
//         id: post.get('profile')?.id,
//         name: post.get('profile')?.get('name') ?? 'Anonymous',
//         avatar: post.get('profile')?.get('avatar'),
//         followersCount: post.get('profile')?.get('followersCount') ?? 0,
//         followingCount: post.get('profile')?.get('followingCount') ?? 0,
//         likesCount: post.get('profile')?.get('likesCount') ?? 0,
//         coverPhoto: post.get('profile')?.get('coverPhoto'),
//       },
//       metrics: {
//         likesCount,
//         hasLiked,
//         hasSaved: false, // TODO
//       },
//       id: post.id,
//       key: `${imagePreviewUrl ?? imagePlaceholder}`,
//       postType,
//       media,
//       source: imagePreviewSource,
//       dimensions: imagePreviewDimensions,
//       caption: post.get('caption'),
//       viewersCount: post.get('viewersCount'),
//       location: post.get('location'),
//       __refactored: true,
//     };
//   });
// }

// const NoteDetailScreen = (props) => {
//   const navigation = useNavigation();
//   const { noteDetails } = props.route.params;

//   // console.log({ noteDetails });

//   const [posts, setPosts] = React.useState([]);

//   const [isRefreshing, setIsRefreshing] = React.useState(false);
//   const [isLoading, setIsLoading] = React.useState(true);
//   const [error, setError] = React.useState(null);

//   React.useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const posts = await fetchPosts(noteDetails);
//         setPosts(posts);
//       } catch (error) {
//         setPosts([]);
//         setError(error);
//         console.error(`Failed to fetch posts for selected note: ${error}`);
//       }

//       setIsLoading(false);
//       setIsRefreshing(false);
//     };

//     if (isLoading || isRefreshing) fetchData();
//   }, [isRefreshing]);

//   const handleRefresh = () => {
//     if (!isRefreshing) setIsRefreshing(true);
//   };

//   const handlePressPost = (postData) => {
//     const postDetails = {
//       ...postData,
//     };

//     navigation.push('PostDetailScreen', postDetails);
//   };

//   const handlePressAvatar = (postData) => {
//     navigation.push('UserProfileScreen', {
//       userProfile: postData.author,
//       metrics: postData.metrics,
//     });
//   };

//   if (isLoading) {
//     return (
//       <LoadingTabView
//         message="Loading posts..."
//         style={{ flex: 1, backgroundColor: colors.white }}
//       />
//     );
//   }

//   if (error) {
//     return (
//       <ErrorTabView
//         error={error}
//         style={{ flex: 1, backgroundColor: colors.white }}
//       />
//     );
//   }

//   return (
//     <MasonryList
//       sorted
//       rerender
//       columns={2}
//       images={posts}
//       listContainerStyle={{ paddingTop: values.spacing.sm }}
//       // onEndReachedThreshold={0.1}
//       // onEndReached={addPosts}
//       masonryFlatListColProps={{
//         ListEmptyComponent: () => (
//           <EmptyTabView
//             message="This note is empty"
//             style={{ width: '100%' }}
//           />
//         ),
//         refreshControl: (
//           <RefreshControl
//             refreshing={isRefreshing}
//             onRefresh={handleRefresh}
//             colors={[colors.gray500]}
//             tintColor={colors.gray500}
//           />
//         ),
//       }}
//       completeCustomComponent={({ data }) => (
//         <PostItem
//           id={data.id}
//           kind={data.postType}
//           text={data.caption}
//           author={data.author}
//           metrics={data.metrics}
//           column={data.column}
//           displayActions={false}
//           imagePreview={data.source}
//           imagePreviewDimensions={data.masonryDimensions}
//           onPressPost={() => handlePressPost(data)}
//           onPressAvatar={() => handlePressAvatar(data)}
//           style={{ marginHorizontal: values.spacing.xs * 1.1 }}
//         />
//       )}
//     />
//   );
// };

// export default NoteDetailScreen;

import React from 'react';
import { Text, View } from 'react-native';

export default function NoteDetailScreen() {
  return (
    <View>
      <Text>NoteDetailScreen</Text>
    </View>
  );
}
