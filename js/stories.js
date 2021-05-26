'use strict';

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  //check if there is a current user, return true/false, use info to
  //generate star

  const showStar = Boolean(currentUser);

  //if showDeleteBtn is default, to not show button
  //pass in true for logged in user

  return $(`
      <li id="${story.storyId}">      
        ${showDeleteBtn ? getDeleteBtnHTML() : ''}
        ${showStar ? getStarHTML(story, currentUser) : ''}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

// Create delete button for logged in user

function getDeleteBtnHTML() {
  return `<span class="trash">
              <i class="fas fa-trash-alt"></i>
          </span>`;
}

// Create favorite/not-favorite star for logged in user
// Pull favorite boolean status from user Class

function getStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? 'fas' : 'far';

  return `<span class="star">
              <i class="${starType} fa-star"></i>
          <span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug('putStoriesOnPage');

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

// Handles form submition of new story. Grabs data from form, calls .addStory method, adds it to page,
// hides form

async function submitNewStory(e) {
  e.preventDefault();

  const title = $('#create-title').val();
  const url = $('#create-url').val();
  const author = $('#create-author').val();
  const username = currentUser.username;

  const storyData = { title, url, author, username };

  const story = await storyList.addStory(currentUser, storyData);

  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  $submitForm.slideUp();
  $submitForm.trigger('reset');
}

$submitForm.on('submit', submitNewStory);

//handle deleting submitted stories from myStories nav page

async function deleteStory(e) {
  //find the id of the clicked story
  const $closestLi = $(e.target).closest('li');
  const storyId = $closestLi.attr('id');

  //remove the story off the API
  await storyList.removeStory(currentUser, storyId);

  //recreate the story list without the deleted story
  await putUserStoriesOnPage();
}

$ownStories.on('click', '.trash', deleteStory);

//Handle user's own story submissions

function putUserStoriesOnPage() {
  $ownStories.empty();

  //check to see if current user has submitted stories
  //if not, alert as such

  if (currentUser.ownStories.length === 0) {
    $ownStories.append(`<h5>No stories added by ${currentUser.username}!</h5>`);
  } else {
    //loop through submitted user stories and append them to page
    for (let story of currentUser.ownStories) {
      let $story = generateStoryMarkup(story, true);
      $ownStories.append($story);
    }
  }
  $ownStories.show();
}

//Handle user's favorite stories - starring/unstaring a story

//Putting favorites list on page

function putFavoritesListOnPage() {
  $favoritedStories.empty();

  //check to see if current user has favorited stories
  //if not, alert as such
  if (currentUser.favorites.length === 0) {
    $favoritedStories.append(
      `<h5>No favorites found for ${currentUser.username}`
    );
  } else {
    //loop through all stories marked as favorite by user and append to page
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }
  $favoritedStories.show();
}

//toggling favorite instance for stories
//updating DOM and updating API

async function toggleStoryFavorite(e) {
  const $tgt = $(e.target);
  const $closestLi = $tgt.closest('li');
  const storyId = $closestLi.attr('id');
  //find storyId in story array and match it to DOM element clicked
  const story = storyList.stories.find((s) => s.storyId === storyId);

  if ($tgt.hasClass('fas')) {
    console.debug('addFav');
    //if it is currently a fav story, remove it from API and
    //change class to non fav star
    await currentUser.removeFavorite(story);
    $tgt.closest('i').toggleClass('fas far');
  } else {
    console.debug('remFav');
    //if it is currently not a fav story, add it to the API and
    //change class to fav star
    await currentUser.addFavorite(story);
    $tgt.closest('i').toggleClass('fas far');
  }
}

$storiesLists.on('click', '.star', toggleStoryFavorite);
