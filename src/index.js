import createBareServer from "@tomphttp/bare-server-node";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { fileURLToPath } from "node:url";
import { createServer as createHttpServer } from "node:http";
import serveStatic from "serve-static";
import express from "express";
import fs from 'fs';
const app = express();
const PORT = 80
const server = createHttpServer();
import basicAuth from 'express-basic-auth';
import createRammerhead from 'rammerhead/src/server/index.js';
function generateRandomString(length) {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}
const randomString = '/' + generateRandomString(50) + '/' + generateRandomString(50) + '/'
app.get('/server/', (req, res) => { 
  res.json({ bare: randomString });
});
// const bare = createBareServer('/security/api/protection/');
const bare = createBareServer(randomString);
app.use((req, res, next) => {
  if (req.path.startsWith(randomString)) {
      bare.routeRequest(req, res);
  } else {
      const users = { 'admin': 'supersecret', 'benton': 'mena', 'anton': 'mena', 'sui': 'run' };

      // middleware for handling authentication
      const authMiddleware = basicAuth({
        users,
        challenge: req.path === '/login', // challenge only for routes other than '/'
        unauthorizedResponse: getUnauthorizedResponse,
      });

      authMiddleware(req, res, (err) => {
        if (err || !req.auth) {
          if (req.path !== '/login' ) {
            res.send(getUnauthorizedResponse(req));
          } else {
            next(err);
          }
        } else {
          // The user is authenticated, proceed to next middleware or route handler
          next();
        }
      });
  }
});




app.use('/uv', (req, res, next) => {
  if (req.url.endsWith('uv.config.js')) {
    // If the requested URL ends with uv.config.js, serve it as a static file
    return next();
  }
  // Otherwise, serve the contents of the uvPath directory
  serveStatic(uvPath)(req, res, next);
});
const rh = createRammerhead();
const rammerheadScopes = [
	'/rammerhead.js',
	'/hammerhead.js',
	'/transport-worker.js',
	'/task.js',
	'/iframe-task.js',
	'/worker-hammerhead.js',
	'/messaging',
	'/sessionexists',
	'/deletesession',
	'/newsession',
	'/editsession',
	'/needpassword',
	'/syncLocalStorage',
	'/api/shuffleDict',
];
function shouldRouteRh(req) {
  const RHurl = new URL(req.url, 'http://0.0.0.0');
  return (
    rammerheadScopes.includes(RHurl.pathname) ||
    rammerheadSession.test(RHurl.pathname)
  );
}
function routeRhRequest(req, res) {
  rh.emit('request', req, res);
}
//@ts-ignore
function routeRhUpgrade(req, socket, head) {
    try {
      rh.emit('upgrade', req, socket, head);
    }
    catch (error) {}
  }
const rammerheadSession = /^\/[a-z0-9]{32}/;
app.use((req, res, next) => {
  const url = req.url;
  if (url.endsWith('.html')) {
    res.statusCode = 404;
    next();
  } else {
    if (url.endsWith('/')) {
      res.statusCode = 404;
      next();
    } else {
    next();
  }
}});
app.use((req, res, next) => {
  if (shouldRouteRh(req)) {
    routeRhRequest(req, res);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  if (req.upgrade) {
    routeRhUpgrade(req, req.socket, req.head);
  } else {
    next();
  }
});
app.use(serveStatic(fileURLToPath(new URL("../static/", import.meta.url))));
const shuttleroutes = {
  '/shuttle/': 'index.html',
  '/shuttle/games': 'games.html',
  '/shuttle/settings': 'settings.html',
  '/shuttle/apps': 'apps.html',
  '/shuttle/discord': 'discord.html',
  '/shuttle/chat': 'chat.html'
};
const nebularoutes = {
  '/nebula/': 'index.html',
  '/nebula/options': 'options.html',
  '/nebula/privacy': 'privacy.html',
  '/nebula/unv': 'unv.html',
};

function handleRoutes(req, res, next) {
  const nfilename = nebularoutes[req.url];
  if (nfilename) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html");
    res.end(fs.readFileSync(`./src/html/nebula/${nfilename}`));
  } else {
    const filename = shuttleroutes[req.url];
    if (filename) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html");
      res.end(fs.readFileSync(`./src/html/shuttle/${filename}`));
    } else if (req.url.startsWith('/shuttle/') || req.url.startsWith('/nebula/')) {
      res.statusCode = 404;
      res.end(fs.readFileSync('src/html/404.html'));
      next();
    } else {
      // If the requested URL does not match any of the routes, pass the request to the next middleware function
      next();
    }
  }
}


app.use(handleRoutes)

server.on("request", app);
server.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req)) {
      bare.routeUpgrade(req, socket, head);
  } 
  else if (shouldRouteRh(req)) {
      try {
          routeRhUpgrade(req, socket, head);
      }
      catch (error) {}
  }
  else {
      socket.end();
  }
});

app.use((req, res) => {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/html");
  res.end(fs.readFileSync('src/html/404.html'));
});
function getUnauthorizedResponse(req) {
  return `
<!DOCTYPE html>
<!--[if IE 6]><html class="ie ie6 no-js" lang="en-US"><![endif]-->
<!--[if IE 7]><html class="ie ie7 no-js" lang="en-US"><![endif]-->
<!--[if IE 8]><html class="ie ie8 no-js" lang="en-US"><![endif]-->
<!--[if !(IE 7) | !(IE 8) ]><!-->
<html class="no-js" lang="en-US">
<!--<![endif]-->
  <head>
    <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <link rel="profile" href="http://gmpg.org/xfn/11" />
    <link rel="pingback" href="https://bsd405.org/xmlrpc.php" />
        <link rel="shortcut icon" href="https://bsd405.org/wp-content/uploads/2015/05/favicon.png" />    <!-- begin wp_head -->
	<title>Bellevue School District</title>
<meta name='robots' content='max-image-preview:large' />
<meta property="og:type" content="article" /> 
<meta property="og:title" content="Home" />
<meta property="og:url" content="https://bsd405.org/" />
<meta property="og:site_name" content="Bellevue School District" />
<meta property="article:publisher" content="https://www.facebook.com/bsd405" />
<meta property="article:published_time" content="2015-05-13T16:48:41-07:00" />
<meta property="article:modified_time" content="2023-06-09T08:41:25-07:00" />
<meta property="og:updated_time" content="2023-06-09T08:41:25-07:00" />
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="Home">
<meta name="twitter:description" content="">
<meta name="twitter:site" content="@thebsd405">
<link rel='dns-prefetch' href='//fonts.googleapis.com' />
<link rel='stylesheet' id='ai1ec_style-css' href='//bsd405.org/wp-content/plugins/all-in-one-event-calendar/cache/05c442f8_ai1ec_parsed_css.css?ver=3.0.0' type='text/css' media='all' />
<link rel='stylesheet' id='sbi_styles-css' href='https://bsd405.org/wp-content/plugins/instagram-feed-pro/css/sbi-styles.min.css?ver=6.2.4' type='text/css' media='all' />
<link rel='stylesheet' id='wpa-style-css' href='https://bsd405.org/wp-content/plugins/wp-accessibility/css/wpa-style.css?ver=1.6.1' type='text/css' media='all' />
<style id='wpa-style-inline-css' type='text/css'>

.wpa-hide-ltr#skiplinks a, .wpa-hide-ltr#skiplinks a:hover, .wpa-hide-ltr#skiplinks a:visited {
	
}
.wpa-hide-ltr#skiplinks a:active,  .wpa-hide-ltr#skiplinks a:focus {
	
}
	:root { --admin-bar-top : 7px; }
</style>
<link rel='stylesheet' id='parent-style-css' href='https://bsd405.org/wp-content/themes/route/style.css?ver=6.2.2' type='text/css' media='all' />
<link rel='stylesheet' id='child-style-css' href='https://bsd405.org/wp-content/themes/route-child/style.css?ver=202304140928' type='text/css' media='all' />
<link rel='stylesheet' id='cs-google-fonts-css' href='//fonts.googleapis.com/css?family=Open+Sans%3A400%2C700%2C600%7CMerriweather%3A700&#038;subset=latin' type='text/css' media='all' />
<link rel='stylesheet' id='cs-icomoon-css' href='https://bsd405.org/wp-content/themes/route/css/vendor/icomoon.css' type='text/css' media='all' />
<link rel='stylesheet' id='cs-royalslider-css' href='https://bsd405.org/wp-content/themes/route/css/vendor/royalslider.css?ver=6.2.2' type='text/css' media='all' />
<link rel='stylesheet' id='cs-font-awesome-css' href='https://bsd405.org/wp-content/themes/route/css/vendor/font-awesome.css' type='text/css' media='all' />
<link rel='stylesheet' id='cs-fancybox-css' href='https://bsd405.org/wp-content/themes/route/css/vendor/fancybox.css' type='text/css' media='all' />
<link rel='stylesheet' id='cs-animations-css' href='https://bsd405.org/wp-content/themes/route/css/vendor/animations.css' type='text/css' media='all' />
<link rel='stylesheet' id='cs-shortcodes-css' href='https://bsd405.org/wp-content/themes/route/css/vendor/shortcodes.css' type='text/css' media='all' />
<link rel='stylesheet' id='cs-grid-css' href='https://bsd405.org/wp-content/themes/route/css/vendor/grid.css' type='text/css' media='all' />
<link rel='stylesheet' id='cs-style-css' href='https://bsd405.org/wp-content/themes/route/css/style.css' type='text/css' media='all' />
<link rel='stylesheet' id='cs-gutenberg-css' href='https://bsd405.org/wp-content/themes/route/css/vendor/gutenberg.css' type='text/css' media='all' />
<link rel='stylesheet' id='route-css' href='https://bsd405.org/wp-content/themes/route-child/style.css?ver=6.2.2' type='text/css' media='all' />
<link rel='stylesheet' id='tablepress-default-css' href='https://bsd405.org/wp-content/plugins/tablepress/css/build/default.css?ver=2.1.4' type='text/css' media='all' />
<link rel='stylesheet' id='js_composer_front-css' href='https://bsd405.org/wp-content/plugins/js_composer/assets/css/js_composer.min.css?ver=6.10.0' type='text/css' media='all' />
<script type='text/javascript' src='https://bsd405.org/wp-content/themes/route/js/modernizr.min.js' id='modernizr-js'></script>
<script type='text/javascript' src='https://bsd405.org/wp-content/plugins/jquery-updater/js/jquery-3.7.0.min.js?ver=3.7.0' id='jquery-core-js'></script>
<script type='text/javascript' src='https://bsd405.org/wp-content/plugins/jquery-updater/js/jquery-migrate-3.4.0.min.js?ver=3.4.0' id='jquery-migrate-js'></script>
<link rel="canonical" href="https://bsd405.org/" />
<meta name="generator" content="Powered by WPBakery Page Builder - drag and drop page builder for WordPress."/>
<link rel="icon" href="https://bsd405.org/wp-content/uploads/2015/10/cropped-BSD-site-icon-32x32.jpg" sizes="32x32" />
<link rel="icon" href="https://bsd405.org/wp-content/uploads/2015/10/cropped-BSD-site-icon-192x192.jpg" sizes="192x192" />
<link rel="apple-touch-icon" href="https://bsd405.org/wp-content/uploads/2015/10/cropped-BSD-site-icon-180x180.jpg" />
<meta name="msapplication-TileImage" content="https://bsd405.org/wp-content/uploads/2015/10/cropped-BSD-site-icon-270x270.jpg" />
<style type="text/css">body{font-family:"Open Sans", Arial, sans-serif;font-size:16px;line-height:1.5em;font-style:normal;font-weight:400;}#site-nav .cs-link{font-family:"Open Sans", Arial, sans-serif;font-style:normal;font-weight:700;}#site-nav ul li ul li .cs-link{font-family:"Open Sans", Arial, sans-serif;font-size:15px;line-height:1.5em;font-style:normal;font-weight:400;}h1, h2, h3, h4, h5, h6{font-family:"Open Sans", Arial, sans-serif;font-style:normal;font-weight:700;}#site-nav .cs-mega-menu &gt; ul &gt; li .cs-title{font-family:"Open Sans", Arial, sans-serif;font-style:normal;font-weight:400;text-transform:uppercase;}ul.list-pages{font-family:"Open Sans", Arial, sans-serif;font-style:normal;font-weight:700;}.cs-dropcap{font-family:"Merriweather", Arial, sans-serif;font-style:normal;font-weight:700;}#cs-mobile-icon strong{font-family:"Open Sans", Arial, sans-serif;font-style:normal;font-weight:700;}#top-bar a{font-family:"Open Sans", Arial, sans-serif;font-style:normal;font-weight:600;}.entry-meta a, .cs-breadcrumb a, .cs-countdown-line, .cs-countdown-boxed{font-family:"Open Sans", Arial, sans-serif;font-style:normal;font-weight:400;}table th, .cs-tab .cs-tab-nav ul, h2.entry-title a, .cs-btn, .cs_blog_posts_widget li a, #copyright{font-family:"Open Sans", Arial, sans-serif;font-style:normal;font-weight:700;}h5{font-family:"Open Sans", Arial, sans-serif;font-size:16px;font-style:normal;font-weight:700;}h3{font-family:"Open Sans", Arial, sans-serif;font-style:normal;font-weight:600;}.cs-sticky-item{line-height:60px !important;height:60px !important;}.cs-header-transparent #page-header .md-padding{padding-top:100px;}.cs-header-transparent #navigation-mobile{padding-top:60px;}.is-compact .cs-sticky-item{line-height:60px !important;height:60px !important;}#site-logo h1, #site-logo img{padding-top:10px;padding-bottom:15px;}@media (max-width:768px) {#site-logo-right,#site-nav{display:none !important;}.cs-header-left #site-logo{display:block !important;float:left;}#cs-mobile-icon{display:block;}#main{padding-top:0 !important;}.cs-header-fancy #site-logo{text-align:left;max-width:85%;}.cs-header-fancy .cs-fancy-row{margin-left:0;margin-right:0;}}@media (max-width:768px) {.is-transparent #top-bar,#top-bar{display:none !important;}.is-transparent.is-transparent-top-bar #masthead{margin-top:0 !important;}.is-transparent-top-bar #page-header .md-padding{padding-top:140px;}}.cs-tab .cs-tab-nav ul li a:hover,.cs-tab .cs-tab-nav ul li.active a,.cs-toggle-title .cs-in,.cs-progress-icon .active,.cs-icon-accent.cs-icon-outlined,.cs-icon-default,.cs-faq-filter a.active,.cs-faq-filter a:hover,.cs-counter,.ajax-close:hover,.isotope-filter a:hover, .isotope-filter a.active,.cs-accordion-title .cs-in,#sidebar .widget_nav_menu ul li.current-menu-item > a,#sidebar .widget_nav_menu ul li a:hover,.route_widget .widget-title h4,.route_widget ul li a:hover,.portfolio-item-description .item-title a:hover,.cs-lang-top-modal ul li a:hover,.comment-reply-link,.related-posts ul li a:hover,.entry-title a:hover,.entry-meta a:hover,.post-navigation a:hover,.page-pagination a:hover,#site-nav ul li ul li .cs-link:hover,#site-nav > ul > li > .cs-link:hover,#site-nav .current-menu-ancestor > .cs-link,#site-nav .current-menu-item > .cs-link,#site-logo h1 a:hover,.cs-lang-top-modal ul li a:hover,.cs-top-module > a:hover,.cs-top-module .cs-open-modal:hover,a,.cs-accent-color {color:#537f20;}#cs-footer-block-before,#cs-footer-block-after,.bbp-pagination-links span.current,#bbp_user_edit_submit,.bbp-submit-wrapper .button,.cs-cart-count,.cs-tab .cs-tab-nav ul li.active a:after,.cs-progress-bar,.cs-pricing-column-accent .cs-pricing-price,.cs-icon-accent.cs-icon-bordered,.cs-icon-accent.cs-icon-bgcolor,.cs-highlight,.cs-fancybox-accent.cs-fancybox-bgcolor,.cs-cta-bgcolor,.cs-btn-outlined-accent:hover,.cs-btn-flat-accent,.page-pagination .current,.widget_calendar tbody a,#sidebar .widget_nav_menu ul li.current-menu-item > a:after,.ajax-pagination .cs-loader:after,#page-header,.cs-menu-effect-7 .cs-depth-0:hover .cs-link-depth-0,.cs-menu-effect .cs-link-depth-0:before,.cs-module-social a:hover,.cs-accent-background {background-color:#537f20;}.bbp-pagination-links span.current,.cs-icon-accent.cs-icon-outlined,.cs-icon-accent.cs-icon-outer,.cs-faq-filter a.active,.cs-fancybox-outlined,.cs-cta-outlined,blockquote,.ajax-close:hover,.isotope-filter a:hover, .isotope-filter a.active,.page-pagination .current,.cs-menu-effect-6 .cs-link-depth-0:before,#site-nav > ul > li > ul,.cs-modal-content,.cs-accent-border{border-color:#537f20;}.cs-menu-effect-4 .cs-link-depth-0:before{color:#537f20;text-shadow:0 0 #537f20;}.cs-menu-effect-4 .cs-link-depth-0:hover::before{text-shadow:8px 0 #537f20, -8px 0 #537f20;}#bbp_user_edit_submit:hover,.bbp-submit-wrapper .button:hover,.cs-btn-flat-accent:hover {background-color:#789a4f;}.cs-btn-outlined-accent {color:#537f20 !important;border-color:#537f20;}.cs-btn-3d-accent {background-color:#537f20;-webkit-box-shadow:0 0.3em 0 #426419;box-shadow:0 0.3em 0 #426419;}.cs-pricing-column-accent .cs-pricing-title{background-color:#426419;}select:focus,textarea:focus,input[type="text"]:focus,input[type="password"]:focus,input[type="email"]:focus,input[type="url"]:focus,input[type="search"]:focus {border-color:#537f20;-webkit-box-shadow:inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(120, 154, 79, 0.6);box-shadow:inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(120, 154, 79, 0.6);}::selection{background-color:#537f20;}::-moz-selection{background-color:#537f20;}body {color:#333;}h2 {font-size:26px;}h3 {font-size:22px;}a,.route_widget ul li a:hover,.related-posts ul li a:hover,.entry-title a:hover,.entry-meta a:hover,.post-navigation a:hover,.page-pagination a:hover {color:#1D77C7;}.heading-18 {font-size:18px;}.icon-shortcut {background-color:#e2e2e2;}.icon-shortcut:hover {background-color:#d2d2d2;}.icon-shortcut .cs-iconbox-heading { font-size:12px;}.cs-btn-flat-black {background-color:#666;}.cs-btn-flat-black:hover {background-color:#537f20;}.cs-icon-bordered, .cs-icon-bgcolor {text-shadow:1px 1px 1px rgba(0,0,0,0.2);}.cs-divider-icon-inner {text-shadow:1px 1px 0px rgba(255, 255, 255, 0.3);}.cs-dropcap {font-size:480%;line-height:0.8em;color:#333;margin-right:10px;margin-top:6px;}.cs-tab.cs-tab-default .cs-tab-nav {padding-left:0px;padding-right:0px;}#top-bar {background-color:#2D333A;}#site-nav .current-menu-ancestor > .cs-link,#site-nav > .current-menu-item > .cs-link {background-color:#537F20; color:#fff;}.cs-menu-effect-7 .cs-depth-0:hover .cs-link-depth-0 {background-color:#4b721d;}#cs-mobile-icon {border-color:#ccc;}#copyright {color:#999999; background-color:#14171a;}#colophon {background-color:#23282d;}#colophon .route_widget ul li {margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #373B40;}ul.list-pages-shortcode li a:hover {color:#FFF;background-color:#537F20;border-color:#537F20;}ul.list-pages-shortcode > li.current_page_item > a,ul.list-pages-shortcode > li > ul > li.current_page_item > a {background-color:#537F20;color:#ffffff;border-color:#537F20;}#site-nav ul li ul li .cs-link {border-top:none; padding:10px;}.BSD-search {width:100%;border:1px solid #e2e2e2;height:55px;}.BSD-search input {width:100%;height:53px;border:none;background:#ffffff;font-size:18px;padding:15px;float:none;border-radius:0;-moz-border-radius:0;-webkit-border-radius:0;box-sizing:border-box;}.BSD-search button {border:1px solid #7f8e4c;width:inherit;padding:0px 25px;position:absolute;height:55px;font-size:20px;background-color:#839e25;color:#ffffff;right:15px;top:0;}.erinyen-2 .tp-tab {opacity:0.65;background:#ffffff;padding:5px 10px 0px;border-radius:2px;}.erinyen-2 .tp-tab.selected, .erinyen-2 .tp-tab:hover {opacity:1;}.erinyen-2 .tp-tab-title {color:#333333;font-size:13px;font-weight:800;text-transform:uppercase;font-family:"Open Sans";margin-bottom:0px;}.erinyen-2 .tp-tab-desc {font-size:12px;line-height:14px;font-weight:400;color:#333333;font-family:"Open Sans";}@media (min-width:683px) {.wpb_revslider_element.wpb_content_element {overflow:hidden;height:0;padding-bottom:30.70%;}}@media (max-width:682px) {.wpb_revslider_element.wpb_content_element {min-height:200px;}}.blog-default .sidebar-right {padding-left:0px;border-left:none;}.sidebar-right .widget-title {padding:20px;background:#e2e2e2;}.route_widget .widget-title h4 { color:#222222;}.sidebar-right .route_widget .widget-title h4 { margin-bottom:0px;}.sidebar-right .cs_blog_posts_widget,.sidebar-right .textwidget,.sidebar-right .ai1ec-agenda-widget-view {padding:20px;border:1px solid #e2e2e2;border-top:none;}.route_widget ul li {margin-bottom:15px;padding-bottom:0px;border-bottom:1px dashed #f2f2f2;}.cs_widget_custom_posts .cs-with-image li {padding-left:0px;min-height:inherit;padding-bottom:10px;}.cs_widget_custom_posts .cs-with-image li a img {position:relative;float:left;margin-right:10px;}.cs-with-image li a img[alt="No Video Picture"] {display:none;}.sidebar-right .cs_widget_custom_posts .cs-with-image li a {font-size:14px;line-height:1.25em;font-weight:600;}.caldera-grid p:last-child {margin-bottom:20px;}.caldera-grid .bsd-btn {color:#ffffff!important;background-color:#537f20!important;border-color:#37590e!important;padding:10px 15px!important;font-weight:600!important;font-size:16px!important;}.caldera-grid .bsd-btn:hover {color:#ffffff!important;background-color:#37590e;border-color:#37590e;}.caldera-grid label {margin-bottom:0px;}.caldera-grid .form-group {margin-bottom:30px;}.caldera-grid hr { margin-top:30px!important; margin-bottom:35px!important;}#tablepress-2 td.column-3,#tablepress-2 td.column-4,#tablepress-7 td.column-5 {font-size:12px;}.bsd-button-blue {background-color:#417298; line-height:1.25em; padding:15px 24px;}.bsd-button-blue:hover {background-color:#6997bf;}.bsd-button-green {background-color:#537f20; line-height:1.25em; padding:15px 24px;}.bsd-button-green:hover {background-color:#629726;}.bsd-button-gray {background-color:#6e6e6e; line-height:1.25em; padding:15px 24px;}.bsd-button-gray:hover {background-color:#8e8e8e;}.bsd-org-chart li {margin-top:20px;}.bsd-org-chart li {margin-top:20px;}.bsd-org-chart h2 {line-height:1.2em;margin-bottom:0px;}@media only screen and (min-width:768px) {.bsd-org-chart {padding:40px;}}</style>
<style type="text/css" data-type="vc_custom-css">/* Generic Banner Template */
.bsd-display-none {display: none;}
.banner-row-padding{padding: 20px;}
.banner-row-padding h2{font-size: 28px; line-height: 1.2em;}

.image-credit a {color: #ffffff; text-decoration: underline;}
.image-credit a:hover {color: #cccccc;}

/* Resource Buttons */
.button-resources {width: 99%; margin: 3px;}

/* Looking Ahead to 2021-2022 */
.banner-inner-row{
    padding: 15px 30px 15px 30px;
}
.banner-inner-row h2{
    font-size: 30px;
    line-height: 1.2em;
}
.banner-inner-column {
    padding: 20px;
}

/*Hero Banner Buttons 4 with 1 large */
.banner-inner-column .cs-column-inner .cs-btn-group {
    white-space: normal;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: flex-start;
}
.banner-inner-column .cs-btn-group .cs-btn-block {
    flex-grow: 1;
}
/*.banner-inner-column .cs-btn-group .cs-btn-block:first-child {*/
/*    width:100%;*/
/*}*/
.banner-inner-column .cs-btn-group .cs-btn-block a {
    width: 100%;
}


@media only screen and (min-width: 683px) {
    /* If the screen size is greater than or equal to 683px */
    .banner-row-padding{padding: 50px;}
    .banner-row-padding h2{font-size: 36px;}
    
    /* Looking Ahead to 2021-2022 */
    .banner-inner-row{
        padding: 25px 40px 25px 40px;
    }
    .banner-inner-row h2{
        font-size: 36px;
    }
    .banner-inner-column {
        padding: 15px;
    }
    
}

@media only screen and (min-width: 768px) {
    /* If the screen size is greater than or equal to 971px */
}

@media only screen and (min-width: 971px) {
    /* If the screen size is greater than or equal to 971px */
    .icon-shortcut {min-height: 120px;}
}

@media only screen and (min-width: 992px) {
    /* If the screen size is greater than or equal to 992px */
    .button-resources {width: 466px;}

    /* open transfer banner CSS */
    .open-transfer .cs-btn-block {
        display: inline-block !important;
        margin-right: 3px;
    }
    .banner-inner-row{
        padding: 30px 40px 30px 40px;
    }
    .banner-outer-row .cs-btn-block {
        display: inline-block !important;
        /*margin-right: 3px;*/
    }
      
}

@media only screen and (min-width: 1200px) {
    /* If the screen size is greater than or equal to 1200px */
    .icon-shortcut {min-height: 100px;}
    .button-resources {width: 376px;}
    .banner-inner-row h2{
        font-size: 40px;
    }
    
        /* Looking Ahead to 2021-2022 */
    .banner-inner-column {
        padding: 30px;
    }
    .banner-inner-row{
        padding: 35px 50px 35px 50px;
    }

    
}

@media only screen and (max-width: 1199px) and (min-width: 992px) {
    /* If the screen size is between 992px and 1199px */
        
    .button-resources {width: 370px;}
}</style><noscript><style> .wpb_animate_when_almost_visible { opacity: 1; }</style></noscript>	<!-- end wp_head -->
  </head>
  
	<!-- Google tag (gtag.js) -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-5ER9V8BXJY"></script>
	<script>
	  window.dataLayer = window.dataLayer || [];
	  function gtag(){dataLayer.push(arguments);}
	  gtag('js', new Date());

	  gtag('config', 'G-5ER9V8BXJY');
	</script>
  
  <body class="home page-template-default page page-id-2469 wp-embed-responsive  cs-header-default cs-menu-effect cs-menu-effect-7      wpb-js-composer js-comp-ver-6.10.0 vc_responsive">

    
    <div id="page" class="hfeed site">
		<!-- begin top-links -->
		<div class="top-links">
			<div class="container">
					<!-- begin gtranslate dropdown menu -->
					<div class="site-translate-menu">
						<span style="font-weight:900; font-size:14px;" aria-hidden="true" >文Á</span>&nbsp;
						<div class="gtranslate_wrapper" id="gt-wrapper-38316863"></div>					</div>
					<!-- end gtranslate dropdown menu -->
				<a style="margin-right: 10px; display: inline-block;" href="https://bsd405.org/about/resources/notices/language-access/">Language Access</a><a style="display: inline-block;" href="https://bsd405.org/website-accessibility/"><i class="fas fa-universal-access" aria-hidden="true"></i> Website Accessibility</a><!-- <a style="margin-left: 10px; display: inline-block;" href="https://healthcheck.bsd405.org/" target="_blank"><i class="cs-in fa fa-check-circle icon-vertically" aria-hidden="true"></i> Health Check</a>-->
			</div>
		</div>
		<!-- end top-links -->
		<div id="top-bar"><div class="container"><div class="cs-top-left"><div class="cs-top-module cs-module-link"><a href="tel:1-425-456-4000"><i class="cs-in fa fa-phone"></i>(425) 456-4000</a></div><div class="cs-top-module cs-module-link"><a href="/help/contact/"><i class="cs-in fa fa-map-marker"></i>12111 NE 1st Street</a></div></div><div class="cs-top-right"><div class="cs-top-module cs-module-modal"><div class="cs-top-modal"><a href="#" class="cs-open-modal">Students<i class="cs-down fa fa-angle-down"></i></a><div class="cs-modal-content"><ul class="ul-striped" style="margin-bottom: 0px;">	
				<li><a href="/bullying-prevention/"><i class="cs-in im im-hand" aria-hidden="true"></i>Bullying Prevention &amp; Social Skills</a></li>
				<li><a href="/calendar/"><i class="cs-in fa fa-calendar" aria-hidden="true"></i>District Calendar</a></li>
				<li><a href="/about/resources/grades-attendance/"><i class="cs-in im im-checkbox" aria-hidden="true"></i>Grades & Attendance</a></li>
				<li><a href="/lunch/"><i class="cs-in im im-food2" aria-hidden="true"></i>Lunch</a></li>
				<li><a href="/about/resources/naviance/"><i class="cs-in fa fa-graduation-cap" aria-hidden="true"></i>Naviance</a></li>
				<li><a href="/onestop/"><i class="cs-in im im-stop2" aria-hidden="true"></i>OneStop</a></li>
				<li><a href="https://wa-bellevue.intouchreceipting.com"><i class="cs-in fa fa-dollar" aria-hidden="true"></i>Payments</a></li>
				<li><a href="/report/"><i class="cs-in fa fa-exclamation-triangle" aria-hidden="true"></i>Report Safety Concern</a></li>
				<li><a href="https://bsd405.sharepoint.com/sites/student/"><i class="cs-in im im-grid5" aria-hidden="true"></i>Student Portal</a></li>
			</ul></div></div></div><div class="cs-top-module cs-module-modal"><div class="cs-top-modal"><a href="#" class="cs-open-modal">Families<i class="cs-down fa fa-angle-down"></i></a><div class="cs-modal-content"><ul class="ul-striped" style="margin-bottom: 0px;">	
				<li><a href="/bullying-prevention/"><i class="cs-in im im-hand" aria-hidden="true"></i>Bullying Prevention &amp; Social Skills</a></li>
				<li><a href="/calendar/"><i class="cs-in fa fa-calendar" aria-hidden="true"></i>District Calendar</a></li>
				<li><a href="/jobs/"><i class="cs-in im im-profile" aria-hidden="true"></i>Employment</a></li>
				<li><a href="/enrollment/"><i class="cs-in fa fa-user-plus" aria-hidden="true"></i>Enrollment</a></li>
				<li><a href="/about/resources/grades-attendance/"><i class="cs-in im im-checkbox" aria-hidden="true"></i>Grades & Attendance</a></li>
				<li><a href="/departments/curriculum/learning-resources-for-students-and-families/"><i class="cs-in im im-bookmark" aria-hidden="true"></i>Family Resources</a></li>
				<li><a href="/departments/family-and-community-engagement/immigrant-undocumented-students-and-ice-enforcement-resources/"><i class="cs-in im im-home" aria-hidden="true"></i>Immigrant, Undocumented Students, and ICE Enforcement Resources</a></li>
				<li><a href="/nutrition-services/"><i class="cs-in im im-food2" aria-hidden="true"></i>Lunch</a></li>
				<li><a href="/about/resources/naviance/"><i class="cs-in fa fa-graduation-cap" aria-hidden="true"></i>Naviance</a></li>
				<li><a href="/onestop/"><i class="cs-in im im-stop2" aria-hidden="true"></i>OneStop</a></li>
				<li><a href="/get-involved/parents/"><i class="cs-in fa fa-group" aria-hidden="true"></i>Parent Groups</a></li>
				<li><a href="https://wa-bellevue.intouchreceipting.com"><i class="cs-in fa fa-dollar" aria-hidden="true"></i>Payments</a></li>
				<li><a href="/report/"><i class="cs-in fa fa-exclamation-triangle" aria-hidden="true"></i>Report Safety Concern</a></li>
			</ul></div></div></div><div class="cs-top-module cs-module-modal"><div class="cs-top-modal"><a href="#" class="cs-open-modal">Community<i class="cs-down fa fa-angle-down"></i></a><div class="cs-modal-content"><ul class="ul-striped" style="margin-bottom: 0px;">	
				<li><a href="/volunteer/"><i class="cs-in im im-heart7" aria-hidden="true"></i>Become a Volunteer</a></li>
				<li><a href="/api/"><i class="cs-in fa fa-tree" aria-hidden="true"></i>Bellevue AP<sup>&reg;</sup> Institute</a></li>
				<li><a href="/calendar/"><i class="cs-in fa fa-calendar" aria-hidden="true"></i>District Calendar</a></li>
				<li><a href="/jobs/"><i class="cs-in im im-profile" aria-hidden="true"></i>Employment</a></li>
				<li><a href="https://bsd405.org/departments/family-and-community-engagement/family-connections-centers/"><i class="cs-in im im-link" aria-hidden="true"></i>Family Connections Center</a></li>
				<li><a href="/departments/facilities/building-use-2/"><i class="cs-in im im-home6" aria-hidden="true"></i>Rent Building Space</a></li>
				<li><a href="/field-rental"><i class="cs-in im im-baseball" aria-hidden="true"></i>Rent Field</a></li>
			</ul></div></div></div><div class="cs-top-module cs-module-modal"><div class="cs-top-modal"><a href="#" class="cs-open-modal">Staff<i class="cs-down fa fa-angle-down"></i></a><div class="cs-modal-content"><ul class="ul-striped" style="margin-bottom: 0px;">	
				<li><a href="http://outlook.com/owa/bsd405.mail.onmicrosoft.com/"><i class="cs-in fa fa-envelope" aria-hidden="true"></i>Email Access</a></li>
				<li><a href="https://bellevuesd405waemployees.munisselfservice.com/login.aspx"><i class="cs-in im im-vcard" aria-hidden="true"></i>Employee Self-Service</a></li>
				<li><a href="https://bsd405.tedk12.com/hire/index.aspx"><i class="cs-in cs-in im im-profile" aria-hidden="true"></i>Employment</a></li>
				<li><a href="/api/"><i class="cs-in fa fa-tree" aria-hidden="true"></i>Bellevue AP<sup>&reg;</sup> Institute</a></li>
				<li><a href="http://www.cvent.com/d/j5qgcp/6T"><i class="cs-in im im-certificate" aria-hidden="true"></i>PD Registration</a> | <a href="http://cventevents.bsd405.org">View My PD</a></li>
				<li><a href="https://bsd405.sharepoint.com/HowTo/SitePages/ESC%20and%20WISC%20Room%20Reservations.aspx"><i class="cs-in im im-home6" aria-hidden="true"></i>Reserve a Room</a></li>
				<li><a href="https://aka.ms/ssprsetup"><i class="cs-in im im-lock5" aria-hidden="true"></i>PR Sign Up</a> | <a href="https://passwordreset.microsoftonline.com">Reset Password</a></li>
				<li><a href="https://bellevue.sfe.powerschool.com" target="_blank" rel="noopener noreferrer"><i class="cs-in im im-users2" aria-hidden="true"></i>SmartFindExpress</a></li>
				<!--<li><a href="https://bsd405.sharepoint.com/search/Pages/BSD-Directory.aspx"><i class="cs-in im im-address-book" aria-hidden="true"></i>Staff Directory (Internal)</a></li>-->
				<li><a href="https://bsd405.sharepoint.com/sites/staff"><i class="cs-in im im-grid5" aria-hidden="true"></i>Staff Portal</a></li>
				<li><a href="https://wa-bsd405.edupoint.com/"><i class="cs-in im im-checkbox" aria-hidden="true"></i>Synergy</a></li>
			</ul></div></div></div></div></div></div><!-- /top-bar -->		<!-- start menu content -->
		 <!-- Otherwise, display the Route menu -->
			<header id="masthead" role="banner">
  <div class="container">
    <div class="cs-inner">
      <div id="site-logo"><a href="https://bsd405.org/" class="cs-sticky-item"><img class="cs-logo" src="https://bsd405.org/wp-content/uploads/2018/02/Bellevue-School-District@60.png" alt="Bellevue School District"/><img class="cs-logo2x" src="//bsd405.org/wp-content/uploads/2018/02/Bellevue-School-District@120.png" alt="Bellevue School District"/></a></div><!-- /site-logo -->
      <nav id="site-nav" role="navigation"><ul id="menu-main-menu" class="main-navigation sf-menu"><li id="menu-item-2547" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-2547 cs-depth-0 cs-mega-menu"><a href="#" class="cs-link cs-link-depth-0 cs-sticky-item">About</a>
<ul class="sub-menu">
	<li id="menu-item-2554" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-2554 cs-depth-1 col-xs-3"><a class="cs-link cs-title cs-column-title">Overview</a>
	<ul class="sub-menu">
		<li id="menu-item-2552" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2552 cs-depth-2"><a href="https://bsd405.org/about/" class="cs-link cs-link-depth-2"><i class="cs-in im im-bars"></i>District Overview</a></li>
		<li id="menu-item-2572" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2572 cs-depth-2"><a href="https://bsd405.org/about/news/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-newspaper-o"></i>District News</a></li>
		<li id="menu-item-2573" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2573 cs-depth-2"><a href="https://bsd405.org/about/calendar/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-calendar"></i>District Calendar</a></li>
		<li id="menu-item-2893" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2893 cs-depth-2"><a href="https://bsd405.org/about/creators-of-their-future-world/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-users"></i>Creators of Their Future World</a></li>
		<li id="menu-item-30641" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-30641 cs-depth-2"><a href="https://bsd405.org/about/press-releases/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-newspaper-o"></i>Press Releases</a></li>
	</ul>
</li>
	<li id="menu-item-2555" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-2555 cs-depth-1 col-xs-3"><a class="cs-link cs-title cs-column-title">Governance</a>
	<ul class="sub-menu">
		<li id="menu-item-2561" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2561 cs-depth-2"><a href="https://bsd405.org/about/policies-procedures/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-file-text-o"></i>Policies &amp; Procedures</a></li>
		<li id="menu-item-2562" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2562 cs-depth-2"><a href="https://bsd405.org/about/school-board/" class="cs-link cs-link-depth-2"><i class="cs-in im im-hammer2"></i>School Board</a></li>
		<li id="menu-item-2571" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2571 cs-depth-2"><a href="https://bsd405.org/about/superintendent/" class="cs-link cs-link-depth-2"><i class="cs-in im im-user"></i>Superintendent</a></li>
		<li id="menu-item-73155" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-73155 cs-depth-2"><a href="https://bsd405.org/about/superintendent-search/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-search"></i>Superintendent Search</a></li>
		<li id="menu-item-2560" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2560 cs-depth-2"><a href="https://bsd405.org/about/administration/" class="cs-link cs-link-depth-2"><i class="cs-in im im-tree5"></i>Administration</a></li>
		<li id="menu-item-61747" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-61747 cs-depth-2"><a target="_blank" href="https://sites.google.com/view/bsdstrategicplan/" class="cs-link cs-link-depth-2"><i class="cs-in im im-numbered-list"></i>Strategic Plan</a></li>
	</ul>
</li>
	<li id="menu-item-2556" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-has-children menu-item-2556 cs-depth-1 col-xs-3"><a class="cs-link cs-title cs-column-title">Initiatives</a>
	<ul class="sub-menu">
		<li id="menu-item-6204" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-6204 cs-depth-2"><a href="https://bsd405.org/about/initiatives/bullying-prevention/" class="cs-link cs-link-depth-2"><i class="cs-in im im-hand"></i>Bullying Prevention &amp; Social Skills</a></li>
		<li id="menu-item-6203" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-6203 cs-depth-2"><a href="https://bsd405.org/about/initiatives/green-schools/" class="cs-link cs-link-depth-2"><i class="cs-in im im-leaf"></i>Green Schools</a></li>
		<li id="menu-item-8778" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-8778 cs-depth-2"><a href="https://bsd405.org/about/initiatives/k12cs/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-code"></i>K-12 Computer Science</a></li>
		<li id="menu-item-2569" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2569 cs-depth-2"><a href="https://bsd405.org/about/initiatives/social-emotional-learning/" class="cs-link cs-link-depth-2"><i class="cs-in im im-bubble-heart"></i>Social &amp; Emotional Learning</a></li>
		<li id="menu-item-66544" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-66544 cs-depth-2"><a href="https://bsd405.org/about/bond/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-building"></i>Capital Project Bond</a></li>
		<li id="menu-item-66658" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-66658 cs-depth-2"><a href="https://bsd405.org/about/school-levies/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-laptop"></i>School Levies</a></li>
	</ul>
</li>
	<li id="menu-item-2558" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-has-children menu-item-2558 cs-depth-1 col-xs-3"><a class="cs-link cs-title cs-column-title">Resources</a>
	<ul class="sub-menu">
		<li id="menu-item-2566" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2566 cs-depth-2"><a href="https://bsd405.org/about/resources/graduation-requirements/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-graduation-cap"></i>Graduation Requirements</a></li>
		<li id="menu-item-2567" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2567 cs-depth-2"><a href="https://bsd405.org/about/resources/notices/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-institution"></i>Official Notices</a></li>
		<li id="menu-item-6658" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-6658 cs-depth-2"><a href="https://bsd405.org/about/resources/school-improvement-plans/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-line-chart"></i>School Improvement Plans</a></li>
		<li id="menu-item-41752" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-41752 cs-depth-2"><a href="https://bsd405.org/about/resources/title-i-lap/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-bar-chart"></i>Title I &amp; LAP</a></li>
	</ul>
</li>
</ul>
</li>
<li id="menu-item-2548" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-2548 cs-depth-0 cs-mega-menu cs-custom"><a href="#" class="cs-link cs-link-depth-0 cs-sticky-item">Schools</a>
<ul class="sub-menu" style="width: 600px">
	<li id="menu-item-2574" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-2574 cs-depth-1 col-xs-6"><a class="cs-link cs-title cs-column-title">Get Started</a>
	<ul class="sub-menu">
		<li id="menu-item-2586" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2586 cs-depth-2"><a href="https://bsd405.org/schools/find-your-school/" class="cs-link cs-link-depth-2"><i class="cs-in im im-search3"></i>Find Your School</a></li>
		<li id="menu-item-2591" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2591 cs-depth-2"><a href="https://bsd405.org/schools/enrollment/" class="cs-link cs-link-depth-2"><i class="cs-in im im-user-plus2"></i>Enrollment</a></li>
		<li id="menu-item-2588" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2588 cs-depth-2"><a href="https://bsd405.org/schools/kindergarten/" class="cs-link cs-link-depth-2"><i class="cs-in im im-puzzle3"></i>Kindergarten</a></li>
		<li id="menu-item-11563" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-11563 cs-depth-2"><a href="https://bsd405.org/schools/start-dismissal-times/" class="cs-link cs-link-depth-2"><i class="cs-in im im-clock3"></i>Start &amp; Dismissal Times</a></li>
		<li id="menu-item-41748" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-41748 cs-depth-2"><a href="https://bsd405.org/schools/attendance/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-bell"></i>Attendance</a></li>
	</ul>
</li>
	<li id="menu-item-2578" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-has-children menu-item-2578 cs-depth-1 col-xs-6"><a class="cs-link cs-title cs-column-title">Schools</a>
	<ul class="sub-menu">
		<li id="menu-item-2585" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2585 cs-depth-2"><a href="https://bsd405.org/schools/elementary/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-star-o"></i>Elementary Schools</a></li>
		<li id="menu-item-2589" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2589 cs-depth-2"><a href="https://bsd405.org/schools/middle/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-star-half-o"></i>Middle Schools</a></li>
		<li id="menu-item-2587" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2587 cs-depth-2"><a href="https://bsd405.org/schools/high/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-star"></i>High Schools</a></li>
		<li id="menu-item-2584" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2584 cs-depth-2"><a href="https://bsd405.org/schools/choice/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-check-square-o"></i>Choice Schools</a></li>
	</ul>
</li>
</ul>
</li>
<li id="menu-item-41746" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-41746 cs-depth-0 cs-mega-menu cs-custom"><a href="#" class="cs-link cs-link-depth-0 cs-sticky-item">Programs</a>
<ul class="sub-menu" style="width: 300px">
	<li id="menu-item-41818" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-41818 cs-depth-1 col-xs-12">
	<ul class="sub-menu">
		<li id="menu-item-66614" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-66614 cs-depth-2"><a href="https://bsd405.org/programs/child-care/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-user-circle"></i>Child Care</a></li>
		<li id="menu-item-66252" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-66252 cs-depth-2"><a href="https://bsd405.org/programs/preschool/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-user-circle-o"></i>Preschool</a></li>
		<li id="menu-item-2579" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2579 cs-depth-2"><a href="https://bsd405.org/programs/cte/" class="cs-link cs-link-depth-2"><i class="cs-in im im-camera"></i>Career &amp; Technical Education</a></li>
		<li id="menu-item-82876" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-82876 cs-depth-2"><a href="https://bsd405.org/programs/dual-credit-options/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-book"></i>Dual Credit Options</a></li>
		<li id="menu-item-80694" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-80694 cs-depth-2"><a href="https://bsd405.org/programs/arabic-language-program/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-comments-o"></i>Arabic Language Program</a></li>
		<li id="menu-item-81699" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-81699 cs-depth-2"><a href="https://bsd405.org/programs/mandarin-dual-language-program/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-comments-o"></i>Mandarin Dual Language Program</a></li>
		<li id="menu-item-81818" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-81818 cs-depth-2"><a href="https://bsd405.org/programs/isa/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-comments-o"></i>International Spanish Academy</a></li>
		<li id="menu-item-2580" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2580 cs-depth-2"><a href="https://bsd405.org/programs/spanish-dual-language/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-comments-o"></i>Spanish Dual Language Program</a></li>
		<li id="menu-item-41759" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-41759 cs-depth-2"><a href="https://bsd405.org/programs/native-american-education-program/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-tree"></i>Native American Education Program</a></li>
		<li id="menu-item-2594" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2594 cs-depth-2"><a href="https://bsd405.org/programs/transition/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-star"></i>Transition Program</a></li>
		<li id="menu-item-52999" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-52999 cs-depth-2"><a href="https://bsd405.org/programs/summer-programs/" class="cs-link cs-link-depth-2"><i class="cs-in im im-sun2"></i>Summer Programs</a></li>
	</ul>
</li>
</ul>
</li>
<li id="menu-item-41747" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-41747 cs-depth-0 cs-mega-menu cs-custom"><a href="#" class="cs-link cs-link-depth-0 cs-sticky-item">Services</a>
<ul class="sub-menu" style="width: 600px">
	<li id="menu-item-41753" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-41753 cs-depth-1 col-xs-6">
	<ul class="sub-menu">
		<li id="menu-item-41744" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-41744 cs-depth-2"><a href="https://bsd405.org/services/counseling/" class="cs-link cs-link-depth-2"><i class="cs-in im im-users"></i>Counseling</a></li>
		<li id="menu-item-2582" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2582 cs-depth-2"><a href="https://bsd405.org/services/mll/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-comments"></i>Multilingual Learners</a></li>
		<li id="menu-item-41750" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-41750 cs-depth-2"><a href="https://bsd405.org/services/foster-care-education/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-user"></i>Foster Care Education</a></li>
		<li id="menu-item-2583" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2583 cs-depth-2"><a href="https://bsd405.org/services/advanced-learning/" class="cs-link cs-link-depth-2"><i class="cs-in im im-meter-fast"></i>Advanced Learning Services</a></li>
		<li id="menu-item-2607" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2607 cs-depth-2"><a href="https://bsd405.org/services/health/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-heartbeat"></i>Health Services</a></li>
		<li id="menu-item-75864" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-75864 cs-depth-2"><a href="https://bsd405.org/services/mental-health-services/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-users"></i>Mental Health Services</a></li>
	</ul>
</li>
	<li id="menu-item-41754" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-41754 cs-depth-1 col-xs-6">
	<ul class="sub-menu">
		<li id="menu-item-41749" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-41749 cs-depth-2"><a href="https://bsd405.org/services/homeless/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-user"></i>Students Experiencing Homelessness</a></li>
		<li id="menu-item-2609" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2609 cs-depth-2"><a href="https://bsd405.org/services/nutrition-services/" class="cs-link cs-link-depth-2"><i class="cs-in im im-food2"></i>Nutrition Services</a></li>
		<li id="menu-item-41751" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-41751 cs-depth-2"><a href="https://bsd405.org/services/section-504/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-universal-access"></i>Section 504</a></li>
		<li id="menu-item-4849" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-4849 cs-depth-2"><a href="https://bsd405.org/services/special-education/" class="cs-link cs-link-depth-2"><i class="cs-in im im-star6"></i>Special Education</a></li>
		<li id="menu-item-77933" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-77933 cs-depth-2"><a href="https://bsd405.org/services/student-life/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-user-circle-o"></i>Student Life</a></li>
	</ul>
</li>
</ul>
</li>
<li id="menu-item-2549" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-2549 cs-depth-0 cs-mega-menu"><a href="#" class="cs-link cs-link-depth-0 cs-sticky-item">Departments</a>
<ul class="sub-menu">
	<li id="menu-item-2596" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-2596 cs-depth-1 col-xs-4">
	<ul class="sub-menu">
		<li id="menu-item-2600" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2600 cs-depth-2"><a href="https://bsd405.org/departments/athletics-activities/" class="cs-link cs-link-depth-2"><i class="cs-in im im-soccer"></i>Athletics &amp; Activities</a></li>
		<li id="menu-item-2601" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2601 cs-depth-2"><a href="https://bsd405.org/departments/communications/" class="cs-link cs-link-depth-2"><i class="cs-in im im-bubbles3"></i>Communications</a></li>
		<li id="menu-item-2602" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2602 cs-depth-2"><a href="https://bsd405.org/departments/teaching-and-learning/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-book"></i>Teaching &amp; Learning</a></li>
		<li id="menu-item-2604" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2604 cs-depth-2"><a href="https://bsd405.org/departments/facilities/" class="cs-link cs-link-depth-2"><i class="cs-in im im-office"></i>Facilities</a></li>
	</ul>
</li>
	<li id="menu-item-2597" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-2597 cs-depth-1 col-xs-4">
	<ul class="sub-menu">
		<li id="menu-item-48132" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-48132 cs-depth-2"><a href="https://bsd405.org/departments/equity-family-community-engagement/" class="cs-link cs-link-depth-2"><i class="cs-in im im-home"></i>Equity, Family and Community Engagement</a></li>
		<li id="menu-item-2605" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2605 cs-depth-2"><a href="https://bsd405.org/departments/finance/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-dollar"></i>Finance</a></li>
		<li id="menu-item-2608" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2608 cs-depth-2"><a href="https://bsd405.org/departments/hr/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-group"></i>Human Resources</a></li>
		<li id="menu-item-2610" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2610 cs-depth-2"><a href="https://bsd405.org/departments/records/" class="cs-link cs-link-depth-2"><i class="cs-in im im-file4"></i>Records</a></li>
	</ul>
</li>
	<li id="menu-item-2598" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-2598 cs-depth-1 col-xs-4">
	<ul class="sub-menu">
		<li id="menu-item-13246" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-13246 cs-depth-2"><a href="https://bsd405.org/departments/security/" class="cs-link cs-link-depth-2"><i class="cs-in im im-shield"></i>Safety &amp; Security</a></li>
		<li id="menu-item-2612" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2612 cs-depth-2"><a href="https://bsd405.org/departments/student-placement/" class="cs-link cs-link-depth-2"><i class="cs-in im im-user-plus2"></i>Student Placement</a></li>
		<li id="menu-item-2614" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2614 cs-depth-2"><a href="https://bsd405.org/departments/district-technology/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-laptop"></i>Technology</a></li>
		<li id="menu-item-2615" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2615 cs-depth-2"><a href="https://bsd405.org/departments/transportation/" class="cs-link cs-link-depth-2"><i class="cs-in fa fa-bus"></i>Transportation</a></li>
	</ul>
</li>
</ul>
</li>
<li id="menu-item-2550" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-2550 cs-depth-0"><a href="#" class="cs-link cs-link-depth-0 cs-sticky-item">Get Involved</a>
<ul class="sub-menu">
	<li id="menu-item-40306" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-40306 cs-depth-1"><a href="https://bsd405.org/get-involved/community-advisory-groups/" class="cs-link cs-link-depth-1"><i class="cs-in fa fa-comment"></i>Community Advisory Groups</a></li>
	<li id="menu-item-2621" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2621 cs-depth-1"><a href="https://bsd405.org/get-involved/community-partners/" class="cs-link cs-link-depth-1"><i class="cs-in im im-office"></i>Community Partners</a></li>
	<li id="menu-item-32806" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-32806 cs-depth-1"><a href="https://bsd405.org/get-involved/community-truancy-board/" class="cs-link cs-link-depth-1"><i class="cs-in fa fa-clock-o"></i>Community Truancy Board</a></li>
	<li id="menu-item-35111" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-35111 cs-depth-1"><a href="https://bsd405.org/get-involved/parents/" class="cs-link cs-link-depth-1"><i class="cs-in fa fa-users"></i>Parent Groups</a></li>
	<li id="menu-item-35110" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-35110 cs-depth-1"><a href="https://bsd405.org/get-involved/volunteer/" class="cs-link cs-link-depth-1"><i class="cs-in fa fa-heart"></i>Volunteer</a></li>
</ul>
</li>
<li id="menu-item-2551" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-2551 cs-depth-0"><a href="#" class="cs-link cs-link-depth-0 cs-sticky-item">Help</a>
<ul class="sub-menu">
	<li id="menu-item-2619" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2619 cs-depth-1"><a href="https://bsd405.org/help/contact/" class="cs-link cs-link-depth-1"><i class="cs-in fa fa-comment"></i>Contact Us</a></li>
	<li id="menu-item-16848" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-16848 cs-depth-1"><a href="https://bsd405.org/help/closure/" class="cs-link cs-link-depth-1"><i class="cs-in im im-blocked"></i>Emergency Closures</a></li>
	<li id="menu-item-61838" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-61838 cs-depth-1"><a href="https://bsd405.org/help/power-internet-outages/" class="cs-link cs-link-depth-1"><i class="cs-in im im-powercord"></i>Power &amp; Internet Outages</a></li>
	<li id="menu-item-2617" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2617 cs-depth-1"><a href="https://bsd405.org/help/faq/" class="cs-link cs-link-depth-1"><i class="cs-in fa fa-question-circle"></i>FAQ</a></li>
	<li id="menu-item-4684" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-4684 cs-depth-1"><a href="https://bsd405.org/help/onestop/" class="cs-link cs-link-depth-1"><i class="cs-in fa fa-stop-circle-o"></i>OneStop</a></li>
	<li id="menu-item-2616" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2616 cs-depth-1"><a href="https://bsd405.org/help/report/" class="cs-link cs-link-depth-1"><i class="cs-in fa fa-exclamation-triangle"></i>Report a Safety Concern</a></li>
	<li id="menu-item-2618" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-2618 cs-depth-1"><a href="https://bsd405.org/help/staff/" class="cs-link cs-link-depth-1"><i class="cs-in im im-address-book"></i>Staff Directory</a></li>
	<li id="menu-item-4378" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-4378 cs-depth-1"><a href="https://bsd405.org/help/stayconnected/" class="cs-link cs-link-depth-1"><i class="cs-in fa fa-share-alt"></i>Stay Connected</a></li>
</ul>
</li>
<li class="cs-depth-0 cs-menu-search cs-top-modal"><a id="nav-search" href="#" class="cs-link cs-sticky-item cs-open-modal"><span class="fa fa-search"></span></a><div class="cs-modal-content cs-module-search"><div class="cs-search-form">
  <form action="/search">
    <input type="search" aria-label="Search Form" placeholder="Search BSD405..." name="q" class="cs-search" />
    <button type="submit" aria-label="Search Button" class="fa fa-search"></button>
  </form>
</div></div></li></ul></nav><!-- /site-nav -->
      <div id="cs-mobile-icon"><strong class="hidden-xs">Home</strong><span><i class="cs-one"></i><i class="cs-two"></i><i class="cs-three"></i></span></div><!-- /mobile-icon -->
    </div>
  </div>
  <div id="site-header-shadow"></div>
</header><!-- /header -->
						<div id="navigation-mobile">
			  <div class="container">

				<div class="menu-mobile-menu-container"><ul id="menu-mobile-menu" class="menu"><li id="menu-item-70698" class="menu-item menu-item-type-custom menu-item-object-custom current-menu-ancestor current-menu-parent menu-item-has-children menu-item-70698"><a href="#">Students</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div>
<ul class="sub-menu">
	<li id="menu-item-4685" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-4685"><a target="_blank" rel="noopener" href="https://wa-bsd405-psv.edupoint.com/Login_Student_PXP.aspx?regenerateSessionId=True">StudentVUE</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70701" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70701"><a href="https://bsd405.org/bullying-prevention/">Bullying Prevention &#038; Social Skills</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-4904" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-4904"><a href="https://bsd405.org/about/calendar/">District Calendar</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70703" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70703"><a href="https://bsd405.org/departments/district-technology/grades-attendance/">Grades &#038; Attendance</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-4687" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-4687"><a href="https://bsd405.org/services/nutrition-services/lunch/">Lunch</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-25270" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-25270"><a href="https://bsd405.org/about/initiatives/college/naviance/">Naviance</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-5286" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-5286"><a href="https://bsd405.org/help/onestop/">OneStop</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-4906" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-4906"><a target="_blank" rel="noopener" href="https://wa-bellevue.intouchreceipting.com/">Payments</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70706" class="menu-item menu-item-type-custom menu-item-object-custom current-menu-item current_page_item menu-item-home menu-item-70706"><a href="https://bsd405.org" aria-current="page">Report Safety Concern</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-25269" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-25269"><a href="https://bsd405.sharepoint.com/sites/student/">Student Portal</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
</ul>
</li>
<li id="menu-item-70700" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-70700"><a href="#">Families</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div>
<ul class="sub-menu">
	<li id="menu-item-32722" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-32722"><a target="_blank" rel="noopener" href="https://wa-bsd405-psv.edupoint.com/Login_Parent_PXP.aspx?regenerateSessionId=True">ParentVUE</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70702" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70702"><a href="https://bsd405.org/bullying-prevention/">Bullying Prevention &#038; Social Skills</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70711" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70711"><a href="https://bsd405.org/calendar/">District Calendar</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70707" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70707"><a href="https://bsd405.org/jobs/">Employment</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70708" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70708"><a href="https://bsd405.org/enrollment/">Enrollment</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70704" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70704"><a href="https://bsd405.org/about/resources/grades-attendance/">Grades &#038; Attendance</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-69996" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-69996"><a href="https://bsd405.org/departments/teaching-and-learning/learning-resources-for-students-and-families/">Family Resources</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-65372" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-65372"><a href="https://bsd405.org/departments/family-and-community-engagement/immigrant-undocumented-students-and-ice-enforcement-resources/">Immigrant, Undocumented Students, and ICE Enforcement Resources</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70712" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70712"><a href="https://bsd405.org/nutrition-services/">Lunch</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70713" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70713"><a href="/about/resources/naviance/">Naviance</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70714" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70714"><a href="https://bsd405.org/onestop/">OneStop</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70709" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70709"><a href="https://bsd405.org/get-involved/parents/">Parent Groups</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70715" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70715"><a href="https://wa-bellevue.intouchreceipting.com/">Payments</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70705" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70705"><a href="https://bsd405.org/report/">Report Safety Concern</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
</ul>
</li>
<li id="menu-item-4903" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-4903"><a href="#">Staff Resources</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div>
<ul class="sub-menu">
	<li id="menu-item-4908" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-4908"><a target="_blank" rel="noopener" href="http://outlook.com/owa/bsd405.mail.onmicrosoft.com/">Email Access</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-4909" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-4909"><a target="_blank" rel="noopener" href="https://bellevuesd405waemployees.munisselfservice.com/login.aspx">Employee Self-Service</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-65366" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-65366"><a target="_blank" rel="noopener" href="https://bsd405.tedk12.com/hire/index.aspx">Employment</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-65367" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-65367"><a href="https://bsd405.org/api/">Bellevue AP Institute</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-65368" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-65368"><a target="_blank" rel="noopener" href="http://www.cvent.com/d/j5qgcp/6T">PD Registration</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-5287" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-5287"><a target="_blank" rel="noopener" href="http://cventevents.bsd405.org">View My PD</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-65369" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-65369"><a target="_blank" rel="noopener" href="https://bsd405.sharepoint.com/HowTo/SitePages/ESC%20and%20WISC%20Room%20Reservations.aspx">Reserve a Room</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-65370" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-65370"><a target="_blank" rel="noopener" href="https://aka.ms/ssprsetup">PR Sign Up</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-5289" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-5289"><a target="_blank" rel="noopener" href="https://passwordreset.microsoftonline.com">Reset Password</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-4910" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-4910"><a target="_blank" rel="noopener" href="https://bellevue.sfe.powerschool.com">SmartFindExpress</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-65371" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-65371"><a target="_blank" rel="noopener" href="https://bsd405.sharepoint.com/search/Pages/BSD-Directory.aspx">Staff Directory (Internal)</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-5288" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-5288"><a target="_blank" rel="noopener" href="https://bsd405.sharepoint.com/sites/staff">Staff Portal</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-32721" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-32721"><a target="_blank" rel="noopener" href="https://wa-bsd405.edupoint.com/">Synergy</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
</ul>
</li>
<li id="menu-item-83278" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-83278"><a href="#">About</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div>
<ul class="sub-menu">
	<li id="menu-item-70755" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70755"><a href="https://bsd405.org/about/">District Overview</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70756" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70756"><a href="https://bsd405.org/about/news/">District News</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70757" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70757"><a href="https://bsd405.org/about/calendar/">District Calendar</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70758" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70758"><a href="https://bsd405.org/about/creators-of-their-future-world/">Creators of Their Future World</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70759" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70759"><a href="https://bsd405.org/about/press-releases/">Press Releases</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70760" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-70760"><a href="https://bsd405.org/about/policies-procedures/">Policies &#038; Procedures</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70761" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70761"><a href="https://bsd405.org/about/school-board/">School Board</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70763" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70763"><a href="https://bsd405.org/about/superintendent/">Superintendent</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70764" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70764"><a href="https://bsd405.org/about/administration/">Administration</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70765" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70765"><a href="https://bsd405.org/about/strategic-plan/">Strategic Plan</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70771" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70771"><a href="https://bsd405.org/about/initiatives/bullying-prevention/">Bullying Prevention &amp; Social Skills</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70772" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70772"><a href="https://bsd405.org/about/initiatives/green-schools/">Green Schools</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70773" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70773"><a href="https://bsd405.org/about/initiatives/k12cs/">K-12 Computer Science</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70774" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70774"><a href="https://bsd405.org/about/initiatives/social-emotional-learning/">Social &amp; Emotional Learning</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70775" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70775"><a href="https://bsd405.org/about/bond/">Bellevue School District Capital Bond</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70776" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70776"><a href="https://bsd405.org/about/school-levies/">School Levies</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70779" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70779"><a href="https://bsd405.org/about/resources/school-improvement-plans/">School Improvement Plans</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70777" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70777"><a href="https://bsd405.org/about/resources/graduation-requirements/">Graduation Requirements</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70778" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70778"><a href="https://bsd405.org/about/resources/notices/">Official Notices</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70780" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70780"><a href="https://bsd405.org/about/resources/title-i-lap/">Title I &amp; LAP</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
</ul>
</li>
<li id="menu-item-83279" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-83279"><a href="#">Schools</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div>
<ul class="sub-menu">
	<li id="menu-item-70781" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70781"><a href="https://bsd405.org/schools/find-your-school/">Find Your School</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70782" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70782"><a href="https://bsd405.org/schools/enrollment/">Enrollment</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70783" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70783"><a href="https://bsd405.org/schools/kindergarten/">Kindergarten</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70785" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70785"><a href="https://bsd405.org/schools/start-dismissal-times/">Start &amp; Dismissal Times</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70786" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70786"><a href="https://bsd405.org/schools/attendance/">Attendance</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70784" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70784"><a href="https://bsd405.org/schools/elementary/">Elementary Schools</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70788" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70788"><a href="https://bsd405.org/schools/middle/">Middle Schools</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70789" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70789"><a href="https://bsd405.org/schools/high/">High Schools</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70787" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70787"><a href="https://bsd405.org/schools/choice/">Choice Schools</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
</ul>
</li>
<li id="menu-item-83280" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-83280"><a href="#">Programs</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div>
<ul class="sub-menu">
	<li id="menu-item-70790" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70790"><a href="https://bsd405.org/programs/child-care/">Child Care</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70791" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70791"><a href="https://bsd405.org/programs/preschool/">Preschool</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70792" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70792"><a href="https://bsd405.org/programs/cte/">Career &amp; Technical Education</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-80714" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-80714"><a href="https://bsd405.org/programs/arabic-language-program/information/">Arabic Language Program Information</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-81821" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-81821"><a href="https://bsd405.org/programs/mandarin-dual-language-program/">Mandarin Dual Language Program</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-81820" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-81820"><a href="https://bsd405.org/programs/isa/">International Spanish Academy</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70795" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70795"><a href="https://bsd405.org/programs/spanish-dual-language/">Spanish Dual Language Program</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70798" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70798"><a href="https://bsd405.org/programs/native-american-education-program/">Native American Education Program</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70800" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70800"><a href="https://bsd405.org/programs/transition/">Transition Program</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70801" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70801"><a href="https://bsd405.org/programs/bsd-virtual-academy/">Bellevue School District Virtual Academy 2021-2022</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70799" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70799"><a href="https://bsd405.org/programs/summer-programs/">2023 Summer Programs K-12</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
</ul>
</li>
<li id="menu-item-83281" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-83281"><a href="#">Services</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div>
<ul class="sub-menu">
	<li id="menu-item-70802" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70802"><a href="https://bsd405.org/services/counseling/">Counseling</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70803" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70803"><a href="https://bsd405.org/services/mll/">Multilingual Learners</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70804" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70804"><a href="https://bsd405.org/services/foster-care-education/">Foster Care Education</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70805" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70805"><a href="https://bsd405.org/services/advanced-learning/">Advanced Learning Services</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70806" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70806"><a href="https://bsd405.org/services/health/">Health Services</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-75863" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-75863"><a href="https://bsd405.org/services/mental-health-services/">Mental Health Services</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70807" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70807"><a href="https://bsd405.org/services/homeless/">Students Experiencing Homelessness</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70808" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70808"><a href="https://bsd405.org/services/nutrition-services/">Nutrition Services</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70809" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70809"><a href="https://bsd405.org/services/section-504/">Section 504</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70810" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70810"><a href="https://bsd405.org/services/special-education/">Special Education</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
</ul>
</li>
<li id="menu-item-83282" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-83282"><a href="#">Departments</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div>
<ul class="sub-menu">
	<li id="menu-item-70811" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70811"><a href="https://bsd405.org/departments/athletics-activities/">Athletics &amp; Activities</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70812" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70812"><a href="https://bsd405.org/departments/communications/">Communications</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70813" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70813"><a href="https://bsd405.org/departments/teaching-and-learning/">Teaching &amp; Learning</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70815" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70815"><a href="https://bsd405.org/departments/facilities/">Facilities</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70816" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70816"><a href="https://bsd405.org/departments/equity-family-community-engagement/">Equity, Family and Community Engagement</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70817" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70817"><a href="https://bsd405.org/departments/finance/">Finance</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70818" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70818"><a href="https://bsd405.org/departments/hr/">Human Resources</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70819" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70819"><a href="https://bsd405.org/departments/records/">Records</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70820" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70820"><a href="https://bsd405.org/departments/security/">Safety &amp; Security</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70821" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70821"><a href="https://bsd405.org/departments/student-placement/">Student Placement</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70822" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70822"><a href="https://bsd405.org/departments/district-technology/">Technology</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70823" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70823"><a href="https://bsd405.org/departments/transportation/">Transportation</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
</ul>
</li>
<li id="menu-item-83283" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-83283"><a href="#">Get Involved</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div>
<ul class="sub-menu">
	<li id="menu-item-70824" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70824"><a href="https://bsd405.org/get-involved/community-advisory-groups/">Community Advisory Groups</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70826" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70826"><a href="https://bsd405.org/get-involved/community-partners/">Community Partners</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70827" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70827"><a href="https://bsd405.org/get-involved/community-truancy-board/">Community Truancy Board</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70828" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70828"><a href="https://bsd405.org/get-involved/parents/">Parent Groups</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70829" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70829"><a href="https://bsd405.org/get-involved/volunteer/">Volunteer</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
</ul>
</li>
<li id="menu-item-83284" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-83284"><a href="#">Help</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div>
<ul class="sub-menu">
	<li id="menu-item-70831" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70831"><a href="https://bsd405.org/help/search/">Search</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70830" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70830"><a href="https://bsd405.org/help/contact/">Contact Us</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70832" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70832"><a href="https://bsd405.org/help/closure/">Emergency Closures</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70833" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70833"><a href="https://bsd405.org/help/power-internet-outages/">Power &amp; Internet Outages</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70834" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70834"><a href="https://bsd405.org/help/faq/">Frequently Asked Questions</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70835" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70835"><a href="https://bsd405.org/help/onestop/">OneStop</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70836" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70836"><a href="https://bsd405.org/help/report/">Report a Safety Concern</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70837" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70837"><a href="https://bsd405.org/help/sitemap/">Sitemap</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70838" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70838"><a href="https://bsd405.org/help/staff/">Staff Directory</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
	<li id="menu-item-70839" class="menu-item menu-item-type-post_type menu-item-object-page menu-item-70839"><a href="https://bsd405.org/help/stayconnected/">Stay Connected</a><div class="cs-dropdown-plus"><i class="fa fa-plus"></i></div></li>
</ul>
</li>
</ul></div><!-- site-mobile-menu -->

								<!-- begin mobile search form -->
				<form id="mobile-search" action="https://bsd405.org/" method="get">
				  <input type="text" aria-label="Search Form" name="s" placeholder="Search" />
				  <button type="submit" aria-label="Search Button" class="fa fa-search"></button>
				</form>
				<!-- end mobile search form -->
				
				
			  </div>
			</div><!-- /navigation-mobile -->
							<!-- end menu content -->
		<div id="main">

			<div id="content" class="site-content">
				<!-- begin site-wide message -->
				<!-- end site-wide message --><section class="cs-section no-padding" style=" background-color: #f2f2f2;"><div class="container"><div class="row"><div class="col-md-12 hidden-lg hidden-md hidden-sm"><div class="cs-column-inner"><hr class="cs-space" style="margin-top:20px">
	<div class="wpb_raw_code wpb_content_element wpb_raw_html" >
		<div class="wpb_wrapper">
			<div class="BSD-search">
<form action="/search">
<input type="search" placeholder="Search BSD405..." name="q" aria-label="Search Form"/>
<button type="submit" aria-label="Search Button" value="Search"><i class="fa fa-search"></i></button>
</form>
</div>
		</div>
	</div>
<hr class="cs-space" style="margin-top:20px"></div></div></div></div></section><section class="cs-section no-padding cs-section-cover-bg banner-outer-row" style="background-image: url(https://bsd405.org/wp-content/uploads/2023/06/summer-banner-01.png); background-repeat: repeat-y; background-position: 50% 50%; background-color: #000000;"><div class="container"><div class="row"><div class="col-md-12"><div class="cs-column-inner"><section class="cs-section no-padding cs-text-white banner-inner-row" style=" background-color: rgba(0,0,0,0.8); color: #ffffff;"><div class="container"><div class="row"><div class="col-md-12 banner-inner-column"><div class="cs-column-inner"><div class="cs-column-text image-credit"><h2>Summer Resources and Updates</h2>
<p>Stay up-to-date on important topics at BSD, including: district news, upcoming deadlines, events, policies, processes, and more. Use the links below to learn more about each area.</p>
</div><div class="cs-btn-group"><div class="cs-btn-align text-left cs-btn-block"><a id="super-btn" href="https://bsd405.org/finance/budget/transition-planning" class="cs-btn cs-btn-custom cs-btn-square cs-btn-custom-own cs-btn-lg cs-btn-block cs-btn-custom-648778441c353" title="2023-2024 School Transition Planning">School Transitions Planning</a></div><div class="cs-btn-align text-left cs-btn-block"><a href="https://bsd405.org/schools/enrollment/" class="cs-btn cs-btn-custom cs-btn-square cs-btn-custom-own cs-btn-lg cs-btn-block cs-btn-custom-648778441c369">2023-2024 Enrollment</a></div><div class="cs-btn-align text-left cs-btn-block"><a href="https://bsd405.org/summer-resources/" class="cs-btn cs-btn-custom cs-btn-square cs-btn-custom-own cs-btn-lg cs-btn-block cs-btn-custom-648778441c377" title="Summer Resources">Summer Resources</a></div><div class="cs-btn-align text-left cs-btn-block"><a href="https://bsd405.org/graduation-events/" class="cs-btn cs-btn-flat cs-btn-square cs-btn-flat-accent cs-btn-lg cs-btn-block cs-btn-custom-648778441c383">2023 Graduations</a></div><div class="cs-btn-align text-left cs-btn-block"><a href="https://bsd405.org/2023/05/bsd-2023-movie-up-ceremonies/" class="cs-btn cs-btn-flat cs-btn-square cs-btn-flat-accent cs-btn-lg cs-btn-block cs-btn-custom-648778441c38d">Moving Up Ceremonies</a></div></div></div></div></div></div></section></div></div></div></div></section><section class="cs-section custom-padding" style=" padding-top: 20px; padding-bottom:0px;"><div class="container"><div class="row"><div class="col-md-12"><div class="cs-column-inner"><div class="cs-iconbox cs-iconbox-center cs-iconbox-effect icon-shortcut"><a href="http://www.bsd405.org/about/initiatives/bullying-prevention/" class="cs-box-link"><div class="cs-iconbox-header"><div class="cs-iconbox-icon"><span class="cs-in im im-hand cs-icon cs-icon-custom cs-icon-bgcolor cs-icon-circle cs-icon-lg" style="background-color:#f18805;"></span></div><div class="cs-iconbox-title"><h5 class="cs-iconbox-heading">Report Bullying</h5></div></div><div class="cs-iconbox-text"></div></a></div><div class="cs-iconbox cs-iconbox-center cs-iconbox-effect icon-shortcut"><a href="http://www.bsd405.org/help/report/" class="cs-box-link"><div class="cs-iconbox-header"><div class="cs-iconbox-icon"><span class="cs-in im im-warning cs-icon cs-icon-custom cs-icon-bgcolor cs-icon-circle cs-icon-lg" style="background-color:#f18805;"></span></div><div class="cs-iconbox-title"><h5 class="cs-iconbox-heading">Report Concern</h5></div></div><div class="cs-iconbox-text"></div></a></div><div class="cs-iconbox cs-iconbox-center cs-iconbox-effect icon-shortcut"><a href="https://bsd405.org/schools/enrollment/" class="cs-box-link"><div class="cs-iconbox-header"><div class="cs-iconbox-icon"><span class="cs-in im im-user-plus2 cs-icon cs-icon-custom cs-icon-bgcolor cs-icon-circle cs-icon-lg" style="background-color:#e74443;"></span></div><div class="cs-iconbox-title"><h5 class="cs-iconbox-heading">Enrollment</h5></div></div><div class="cs-iconbox-text"></div></a></div><div class="cs-iconbox cs-iconbox-center cs-iconbox-effect icon-shortcut"><a href="http://www.bsd405.org/about/resources/grades-attendance/" class="cs-box-link"><div class="cs-iconbox-header"><div class="cs-iconbox-icon"><span class="cs-in fa fa-check cs-icon cs-icon-custom cs-icon-bgcolor cs-icon-circle cs-icon-lg" style="background-color:#e74443;"></span></div><div class="cs-iconbox-title"><h5 class="cs-iconbox-heading">Grades</h5></div></div><div class="cs-iconbox-text"></div></a></div><div class="cs-iconbox cs-iconbox-center cs-iconbox-effect icon-shortcut"><a href="https://bsd405.org/departments/district-technology/tech-support-students-families/" class="cs-box-link"><div class="cs-iconbox-header"><div class="cs-iconbox-icon"><span class="cs-in fa fa-laptop cs-icon cs-icon-custom cs-icon-bgcolor cs-icon-circle cs-icon-lg" style="background-color:#e74443;"></span></div><div class="cs-iconbox-title"><h5 class="cs-iconbox-heading">Technology Support</h5></div></div><div class="cs-iconbox-text"></div></a></div><div class="cs-iconbox cs-iconbox-center cs-iconbox-effect icon-shortcut"><a href="https://wa-bellevue.intouchreceipting.com" target="_blank" class="cs-box-link"><div class="cs-iconbox-header"><div class="cs-iconbox-icon"><span class="cs-in fa fa-dollar cs-icon cs-icon-custom cs-icon-bgcolor cs-icon-circle cs-icon-lg" style="background-color:#839e25;"></span></div><div class="cs-iconbox-title"><h5 class="cs-iconbox-heading">Payments</h5></div></div><div class="cs-iconbox-text"></div></a></div><div class="cs-iconbox cs-iconbox-center cs-iconbox-effect icon-shortcut"><a href="http://www.bsd405.org/about/calendar/" class="cs-box-link"><div class="cs-iconbox-header"><div class="cs-iconbox-icon"><span class="cs-in fa fa-calendar cs-icon cs-icon-custom cs-icon-bgcolor cs-icon-circle cs-icon-lg" style="background-color:#839e25;"></span></div><div class="cs-iconbox-title"><h5 class="cs-iconbox-heading">Calendar</h5></div></div><div class="cs-iconbox-text"></div></a></div><div class="cs-iconbox cs-iconbox-center cs-iconbox-effect icon-shortcut"><a href="http://www.bsd405.org/departments/nutrition-services/lunch/" class="cs-box-link"><div class="cs-iconbox-header"><div class="cs-iconbox-icon"><span class="cs-in im im-food2 cs-icon cs-icon-custom cs-icon-bgcolor cs-icon-circle cs-icon-lg" style="background-color:#839e25;"></span></div><div class="cs-iconbox-title"><h5 class="cs-iconbox-heading">Menus</h5></div></div><div class="cs-iconbox-text"></div></a></div><div class="cs-iconbox cs-iconbox-center cs-iconbox-effect icon-shortcut"><a href="https://bsd405.org/departments/hr/" class="cs-box-link"><div class="cs-iconbox-header"><div class="cs-iconbox-icon"><span class="cs-in im im-profile cs-icon cs-icon-custom cs-icon-bgcolor cs-icon-circle cs-icon-lg" style="background-color:#2f97c1;"></span></div><div class="cs-iconbox-title"><h5 class="cs-iconbox-heading">Human Resources</h5></div></div><div class="cs-iconbox-text"></div></a></div></div></div></div></div></section><section class="cs-section custom-padding" style=" padding-top: 0px; padding-bottom:0px;"><div class="container"><div class="row"><div class="col-md-12"><div class="cs-column-inner"><div class="cs-column-text"><p style="text-align: center;">
<div id="sb_instagram"  class="sbi sbi_mob_col_2 sbi_tab_col_4 sbi_col_5 sbi_width_resp" style="padding-bottom: 12px;" data-feedid="*2"  data-res="medium" data-cols="5" data-colsmobile="2" data-colstablet="4" data-num="20" data-nummobile="20" data-header-size="medium" data-shortcode-atts="{&quot;feed&quot;:&quot;2&quot;}"  data-postid="2469" data-locatornonce="d4bed7d7ab" data-options="{&quot;carousel&quot;:[true,false,true,500,true,1],&quot;autoscroll&quot;:20,&quot;avatars&quot;:{&quot;bellevueschools405&quot;:&quot;https:\/\/scontent-ord5-2.xx.fbcdn.net\/v\/t51.2885-15\/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5&quot;,&quot;LCLbellevueschools405&quot;:1},&quot;lightboxcomments&quot;:20,&quot;colsmobile&quot;:2,&quot;colstablet&quot;:&quot;4&quot;,&quot;captionsize&quot;:12,&quot;captionlength&quot;:27,&quot;hovercaptionlength&quot;:200}" data-sbi-flags="favorLocal">


    <div id="sbi_images" style="padding: 6px;">
		<div class="sbi_item sbi_type_carousel sbi_new sbi_transition" id="sbi_17924933411707703" data-date="1686420612" data-numcomments="3"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    <svg class="svg-inline--fa fa-clone fa-w-16 sbi_lightbox_carousel_icon" aria-hidden="true" aria-label="Clone" data-fa-proƒcessed="" data-prefix="far" data-icon="clone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	                <path fill="currentColor" d="M464 0H144c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h320c26.51 0 48-21.49 48-48v-48h48c26.51 0 48-21.49 48-48V48c0-26.51-21.49-48-48-48zM362 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h42v224c0 26.51 21.49 48 48 48h224v42a6 6 0 0 1-6 6zm96-96H150a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h308a6 6 0 0 1 6 6v308a6 6 0 0 1-6 6z"></path>
	            </svg>		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">🌈 Happy #pridemonth! On June 1, Cherry Crest Elementary kicked off the Pride month with Rainbow Day! 🌈💖🏳️‍🌈 <br><br>Throughout the year, Cherry Crest celebrates diversity and inclusion and teaches opportunities for “Windows and Mirrors.” Mirrors allow students to see themselves in the curriculum and school environment, while windows provide opportunities for new learning and new perspectives to support growth, empathy, and compassion for all. This year, Cherry Crest celebrated various cultures and heritages, holidays, neurodiversity, and now, in June, they recognize the diverse LGBTQIA+ community within Bellevue and beyond. <br><br>Thank you, Cherry Crest, for this joyful celebration of the uniqueness of all – showing pride for being our unique selves and celebrating unity as a community! 🌈💖🏳️‍🌈 <br><br>This month, and every month, the Bellevue School District celebrates and affirms our LGBTQIA+ community. Happy Pride Month, BSD! ❤️🧡💛💚💙💜🖤<br><br>#WeAreBellevue #LoveisLove #HappyPrideMonth #Joy #Community</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CtUcSJgsqYO/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 10</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        77</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        3</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-2.cdninstagram.com/v/t51.2885-15/352849222_803876517662126_8230002137246554684_n.jpg?_nc_cat=100&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=FoF5TDSsSSMAX8SFawV&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfCGX4VX7IbX5ZFMzR61L3psEol7I2O0xROg0aOcpzxt_w&#038;oe=648B3AFB" rel="nofollow noopener" data-lightbox-sbi="" data-title="🌈 Happy #pridemonth! On June 1, Cherry Crest Elementary kicked off the Pride month with Rainbow Day! 🌈💖🏳️‍🌈 &lt;br&gt;
&lt;br&gt;
Throughout the year, Cherry Crest celebrates diversity and inclusion and teaches opportunities for “Windows and Mirrors.” Mirrors allow students to see themselves in the curriculum and school environment, while windows provide opportunities for new learning and new perspectives to support growth, empathy, and compassion for all. This year, Cherry Crest celebrated various cultures and heritages, holidays, neurodiversity, and now, in June, they recognize the diverse LGBTQIA+ community within Bellevue and beyond. &lt;br&gt;
&lt;br&gt;
Thank you, Cherry Crest, for this joyful celebration of the uniqueness of all – showing pride for being our unique selves and celebrating unity as a community! 🌈💖🏳️‍🌈 &lt;br&gt;
&lt;br&gt;
This month, and every month, the Bellevue School District celebrates and affirms our LGBTQIA+ community. Happy Pride Month, BSD! ❤️🧡💛💚💙💜🖤&lt;br&gt;
&lt;br&gt;
#WeAreBellevue #LoveisLove #HappyPrideMonth #Joy #Community" data-video="" data-carousel="{&quot;data&quot;:[{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/352849222_803876517662126_8230002137246554684_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=FoF5TDSsSSMAX8SFawV&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCGX4VX7IbX5ZFMzR61L3psEol7I2O0xROg0aOcpzxt_w&amp;oe=648B3AFB&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/352668982_1674515739682303_5430572117925963877_n.jpg?_nc_cat=107&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=lxrkyuN1keMAX8rGUaX&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCiEY_bbBcxywQVGIjtZRfu_hqPPSso4RXUOQeZ1YCBRQ&amp;oe=648BE191&quot;}],&quot;vid_first&quot;:false}" data-id="sbi_17924933411707703" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CtUcSJgsqYO/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CtUcSJgsqYO/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-2.cdninstagram.com/v/t51.2885-15/352849222_803876517662126_8230002137246554684_n.jpg?_nc_cat=100&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=FoF5TDSsSSMAX8SFawV&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfCGX4VX7IbX5ZFMzR61L3psEol7I2O0xROg0aOcpzxt_w&#038;oe=648B3AFB" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/352849222_803876517662126_8230002137246554684_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=FoF5TDSsSSMAX8SFawV&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCGX4VX7IbX5ZFMzR61L3psEol7I2O0xROg0aOcpzxt_w&amp;oe=648B3AFB&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/352849222_803876517662126_8230002137246554684_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=FoF5TDSsSSMAX8SFawV&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCGX4VX7IbX5ZFMzR61L3psEol7I2O0xROg0aOcpzxt_w&amp;oe=648B3AFB&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352849222_803876517662126_8230002137246554684_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352849222_803876517662126_8230002137246554684_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="🌈 Happy #pridemonth! On June 1, Cherry Crest Elementary kicked off the Pride month with Rainbow Day! 🌈💖🏳️‍🌈 

Throughout the year, Cherry Crest celebrates diversity and inclusion and teaches opportunities for “Windows and Mirrors.” Mirrors allow students to see themselves in the curriculum and school environment, while windows provide opportunities for new learning and new perspectives to support growth, empathy, and compassion for all. This year, Cherry Crest celebrated various cultures and heritages, holidays, neurodiversity, and now, in June, they recognize the diverse LGBTQIA+ community within Bellevue and beyond. 

Thank you, Cherry Crest, for this joyful celebration of the uniqueness of all – showing pride for being our unique selves and celebrating unity as a community! 🌈💖🏳️‍🌈 

This month, and every month, the Bellevue School District celebrates and affirms our LGBTQIA+ community. Happy Pride Month, BSD! ❤️🧡💛💚💙💜🖤

#WeAreBellevue #LoveisLove #HappyPrideMonth #Joy #Community">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                77</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                3</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_carousel sbi_new sbi_transition" id="sbi_17971309847232792" data-date="1686416002" data-numcomments="2"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    <svg class="svg-inline--fa fa-clone fa-w-16 sbi_lightbox_carousel_icon" aria-hidden="true" aria-label="Clone" data-fa-proƒcessed="" data-prefix="far" data-icon="clone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	                <path fill="currentColor" d="M464 0H144c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h320c26.51 0 48-21.49 48-48v-48h48c26.51 0 48-21.49 48-48V48c0-26.51-21.49-48-48-48zM362 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h42v224c0 26.51 21.49 48 48 48h224v42a6 6 0 0 1-6 6zm96-96H150a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h308a6 6 0 0 1 6 6v308a6 6 0 0 1-6 6z"></path>
	            </svg>		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">Jing Mei Elementary celebrated all their volunteers at a Volunteer Appreciation Breakfast on June 2! Principal Dongmei Tan and Assistant Principal Eric Shelton expressed their gratitude for all the volunteers who have helped to create such strong and vibrant community at Jing Mei. <br><br>Dr. Kelly Aramaki, the district`s incoming superintendent, joined the celebration at Jing Mei to say thank you to all the volunteers for their amazing efforts. <br><br>We are lucky to have such incredible volunteers across our district, at all of our schools! Our volunteers provide classroom and general school support, chaperone field trips, assist with athletics and activities, and donate their time and talents in countless other ways. Thank you, BSD volunteers, for all you do to help our school communities thrive. ❤️<br><br>#WeAreBellevue</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CtUTfVPgg0U/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 10</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        67</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        2</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-2.cdninstagram.com/v/t51.2885-15/353631200_6562884090422920_4153509776370375683_n.jpg?_nc_cat=107&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=OqbYRXrOrGQAX9pR0uw&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfCJOP5bTJFE-_8jmNbB9VJU5MORQV8ALtXLJAJs62mnVw&#038;oe=648AE0B4" rel="nofollow noopener" data-lightbox-sbi="" data-title="Jing Mei Elementary celebrated all their volunteers at a Volunteer Appreciation Breakfast on June 2! Principal Dongmei Tan and Assistant Principal Eric Shelton expressed their gratitude for all the volunteers who have helped to create such strong and vibrant community at Jing Mei. &lt;br&gt;
&lt;br&gt;
Dr. Kelly Aramaki, the district&#039;s incoming superintendent, joined the celebration at Jing Mei to say thank you to all the volunteers for their amazing efforts. &lt;br&gt;
&lt;br&gt;
We are lucky to have such incredible volunteers across our district, at all of our schools! Our volunteers provide classroom and general school support, chaperone field trips, assist with athletics and activities, and donate their time and talents in countless other ways. Thank you, BSD volunteers, for all you do to help our school communities thrive. ❤️&lt;br&gt;
&lt;br&gt;
#WeAreBellevue" data-video="" data-carousel="{&quot;data&quot;:[{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/353631200_6562884090422920_4153509776370375683_n.jpg?_nc_cat=107&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=OqbYRXrOrGQAX9pR0uw&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCJOP5bTJFE-_8jmNbB9VJU5MORQV8ALtXLJAJs62mnVw&amp;oe=648AE0B4&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/352448461_647265680771759_8411818384236688129_n.jpg?_nc_cat=101&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=mi8VuOKIYMYAX-6Fx2X&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfDQVsDw9XexnYT_9Xco2xKZmzVzSeKfYWuM0Npv11NrLQ&amp;oe=648AF69B&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/352593302_978343146699944_7669262589765410586_n.jpg?_nc_cat=109&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=hvC1FuUTDzoAX9SqIK7&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCU6W1jtnz3zrXP5YCGMkj4YZkCEKYH4m53_Gn7jmUfYg&amp;oe=648BCB31&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/352560787_819038483143113_8280277736256148120_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=LEVcja_0VRMAX8huMfZ&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfDTmXNDX8814Ta5rHcpnDQvUEoq_wCxVEUs8cuIZUXw0Q&amp;oe=648B2DBD&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/352568660_1312094492996434_2499965776684160676_n.jpg?_nc_cat=106&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=COoW1BYjTi4AX-dZsC_&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBbzakCaRxjFOaRkNbrXexEFXVsGzemhiZvBreoapho5Q&amp;oe=648B440B&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/352599037_1199190017376756_3362312792228049644_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=JKCxS9s5zXoAX_Bi26S&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCUnw1yQxOzPW585HJ_bLZREANFYilD84Yurk2kMVCC9g&amp;oe=648C7BE5&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/352796875_1290833388224536_7537146142524937347_n.jpg?_nc_cat=109&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=qi3J0tvFY4cAX-H6fIX&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBx9LK5eb7SismPCXmXOrTiJ6rHm3u_cdFUvrKxM61X3A&amp;oe=648C4A2C&quot;}],&quot;vid_first&quot;:false}" data-id="sbi_17971309847232792" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CtUTfVPgg0U/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CtUTfVPgg0U/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-2.cdninstagram.com/v/t51.2885-15/353631200_6562884090422920_4153509776370375683_n.jpg?_nc_cat=107&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=OqbYRXrOrGQAX9pR0uw&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfCJOP5bTJFE-_8jmNbB9VJU5MORQV8ALtXLJAJs62mnVw&#038;oe=648AE0B4" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/353631200_6562884090422920_4153509776370375683_n.jpg?_nc_cat=107&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=OqbYRXrOrGQAX9pR0uw&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCJOP5bTJFE-_8jmNbB9VJU5MORQV8ALtXLJAJs62mnVw&amp;oe=648AE0B4&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/353631200_6562884090422920_4153509776370375683_n.jpg?_nc_cat=107&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=OqbYRXrOrGQAX9pR0uw&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCJOP5bTJFE-_8jmNbB9VJU5MORQV8ALtXLJAJs62mnVw&amp;oe=648AE0B4&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/353631200_6562884090422920_4153509776370375683_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/353631200_6562884090422920_4153509776370375683_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="Jing Mei Elementary celebrated all their volunteers at a Volunteer Appreciation Breakfast on June 2! Principal Dongmei Tan and Assistant Principal Eric Shelton expressed their gratitude for all the volunteers who have helped to create such strong and vibrant community at Jing Mei. 

Dr. Kelly Aramaki, the district&#039;s incoming superintendent, joined the celebration at Jing Mei to say thank you to all the volunteers for their amazing efforts. 

We are lucky to have such incredible volunteers across our district, at all of our schools! Our volunteers provide classroom and general school support, chaperone field trips, assist with athletics and activities, and donate their time and talents in countless other ways. Thank you, BSD volunteers, for all you do to help our school communities thrive. ❤️

#WeAreBellevue">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                67</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                2</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_image sbi_new sbi_transition" id="sbi_17961589652530163" data-date="1686353763" data-numcomments="0"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">Happy Friday, BSD! We are so close to the end of the school year! Here are some smiles brought to you by students at Highland Middle School. 😊 <br><br>&quot;Take a smile, give a smile.<br>Toma una sonrisa, regala una sonrisa.&quot;<br><br>Shout out to teacher Megan Stith for this positive way to end the week. 💙🦅 <br><br>#WeAreBellevue</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CtScx9WsKjW/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 9</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        44</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        0</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-2.cdninstagram.com/v/t51.2885-15/352348515_179164598457671_264043068781058717_n.jpg?_nc_cat=110&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=lKBobRQ54w8AX_WL-JJ&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfB36O4f9YAKSyz541b18uC0blh9z37Sb5lwOV4VrIJASw&#038;oe=648C1B33" rel="nofollow noopener" data-lightbox-sbi="" data-title="Happy Friday, BSD! We are so close to the end of the school year! Here are some smiles brought to you by students at Highland Middle School. 😊 &lt;br&gt;
&lt;br&gt;
&quot;Take a smile, give a smile.&lt;br&gt;
Toma una sonrisa, regala una sonrisa.&quot;&lt;br&gt;
&lt;br&gt;
Shout out to teacher Megan Stith for this positive way to end the week. 💙🦅 &lt;br&gt;
&lt;br&gt;
#WeAreBellevue" data-video="" data-carousel="" data-id="sbi_17961589652530163" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CtScx9WsKjW/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CtScx9WsKjW/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-2.cdninstagram.com/v/t51.2885-15/352348515_179164598457671_264043068781058717_n.jpg?_nc_cat=110&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=lKBobRQ54w8AX_WL-JJ&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfB36O4f9YAKSyz541b18uC0blh9z37Sb5lwOV4VrIJASw&#038;oe=648C1B33" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/352348515_179164598457671_264043068781058717_n.jpg?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=lKBobRQ54w8AX_WL-JJ&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfB36O4f9YAKSyz541b18uC0blh9z37Sb5lwOV4VrIJASw&amp;oe=648C1B33&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/352348515_179164598457671_264043068781058717_n.jpg?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=lKBobRQ54w8AX_WL-JJ&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfB36O4f9YAKSyz541b18uC0blh9z37Sb5lwOV4VrIJASw&amp;oe=648C1B33&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352348515_179164598457671_264043068781058717_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352348515_179164598457671_264043068781058717_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="Happy Friday, BSD! We are so close to the end of the school year! Here are some smiles brought to you by students at Highland Middle School. 😊 

&quot;Take a smile, give a smile.
Toma una sonrisa, regala una sonrisa.&quot;

Shout out to teacher Megan Stith for this positive way to end the week. 💙🦅 

#WeAreBellevue">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                44</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                0</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_carousel sbi_new sbi_transition" id="sbi_18033722041497717" data-date="1686281633" data-numcomments="0"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    <svg class="svg-inline--fa fa-clone fa-w-16 sbi_lightbox_carousel_icon" aria-hidden="true" aria-label="Clone" data-fa-proƒcessed="" data-prefix="far" data-icon="clone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	                <path fill="currentColor" d="M464 0H144c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h320c26.51 0 48-21.49 48-48v-48h48c26.51 0 48-21.49 48-48V48c0-26.51-21.49-48-48-48zM362 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h42v224c0 26.51 21.49 48 48 48h224v42a6 6 0 0 1-6 6zm96-96H150a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h308a6 6 0 0 1 6 6v308a6 6 0 0 1-6 6z"></path>
	            </svg>		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">Congratulations to Sammamish High School Thespians on their production of 9 to 6 the Musical! <br><br>From @shsthespiansociety: I’m so proud of these students and all of their hard work! I want to highlight our group of marvelous seniors. They have been the leaders of our theatre community and we are so honored to share the stage with them! Dreams and plans are in the making for this group of all star humans! <br><br>#SeniorSpotlight #ClosingNight #9to5atSammamishHS #BSDClassof2023 #BSDSeniorSpotlight #WeAreBellevue</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CtQTNM9r6SG/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 9</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        49</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        0</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/352831392_935819867471582_1410113257581679336_n.jpg?_nc_cat=102&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=6nUgAVEOHLMAX_HENBa&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfCS5EUQ3p6gayVW3fv4_7TF__-8CX480ZNxvuCHQr1uDA&#038;oe=648C8E7E" rel="nofollow noopener" data-lightbox-sbi="" data-title="Congratulations to Sammamish High School Thespians on their production of 9 to 6 the Musical! &lt;br&gt;
&lt;br&gt;
From @shsthespiansociety: I’m so proud of these students and all of their hard work! I want to highlight our group of marvelous seniors. They have been the leaders of our theatre community and we are so honored to share the stage with them! Dreams and plans are in the making for this group of all star humans! &lt;br&gt;
&lt;br&gt;
#SeniorSpotlight #ClosingNight #9to5atSammamishHS #BSDClassof2023 #BSDSeniorSpotlight #WeAreBellevue" data-video="" data-carousel="{&quot;data&quot;:[{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352831392_935819867471582_1410113257581679336_n.jpg?_nc_cat=102&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=6nUgAVEOHLMAX_HENBa&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCS5EUQ3p6gayVW3fv4_7TF__-8CX480ZNxvuCHQr1uDA&amp;oe=648C8E7E&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352145194_1383109642421771_416235674820106952_n.jpg?_nc_cat=107&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=BJObBOq7UNQAX_Kg-sL&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBr2kPPd1ID50UGnn2TiPM-GcYnScpArRuvHC7iQDa41A&amp;oe=648C21AF&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.29350-15\/352230622_995308318497358_5213494189356853184_n.jpg?_nc_cat=111&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=ZbBneQT7cvYAX_9P4YC&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfAxVaezr0Cjv491fb2F7ZrbemJt8y-dPSN0wekT9Jfl8Q&amp;oe=648BE057&quot;}],&quot;vid_first&quot;:false}" data-id="sbi_18033722041497717" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CtQTNM9r6SG/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CtQTNM9r6SG/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/352831392_935819867471582_1410113257581679336_n.jpg?_nc_cat=102&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=6nUgAVEOHLMAX_HENBa&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfCS5EUQ3p6gayVW3fv4_7TF__-8CX480ZNxvuCHQr1uDA&#038;oe=648C8E7E" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352831392_935819867471582_1410113257581679336_n.jpg?_nc_cat=102&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=6nUgAVEOHLMAX_HENBa&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCS5EUQ3p6gayVW3fv4_7TF__-8CX480ZNxvuCHQr1uDA&amp;oe=648C8E7E&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352831392_935819867471582_1410113257581679336_n.jpg?_nc_cat=102&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=6nUgAVEOHLMAX_HENBa&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCS5EUQ3p6gayVW3fv4_7TF__-8CX480ZNxvuCHQr1uDA&amp;oe=648C8E7E&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352831392_935819867471582_1410113257581679336_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352831392_935819867471582_1410113257581679336_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="Congratulations to Sammamish High School Thespians on their production of 9 to 6 the Musical! 

From @shsthespiansociety: I’m so proud of these students and all of their hard work! I want to highlight our group of marvelous seniors. They have been the leaders of our theatre community and we are so honored to share the stage with them! Dreams and plans are in the making for this group of all star humans! 

#SeniorSpotlight #ClosingNight #9to5atSammamishHS #BSDClassof2023 #BSDSeniorSpotlight #WeAreBellevue">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                49</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                0</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_carousel sbi_new sbi_transition" id="sbi_18026558206533542" data-date="1686191241" data-numcomments="0"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    <svg class="svg-inline--fa fa-clone fa-w-16 sbi_lightbox_carousel_icon" aria-hidden="true" aria-label="Clone" data-fa-proƒcessed="" data-prefix="far" data-icon="clone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	                <path fill="currentColor" d="M464 0H144c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h320c26.51 0 48-21.49 48-48v-48h48c26.51 0 48-21.49 48-48V48c0-26.51-21.49-48-48-48zM362 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h42v224c0 26.51 21.49 48 48 48h224v42a6 6 0 0 1-6 6zm96-96H150a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h308a6 6 0 0 1 6 6v308a6 6 0 0 1-6 6z"></path>
	            </svg>		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">From @sammamish_choir: Congratulations, Seniors! Such a talented group of young adults that we had the honor of working alongside. We wish them luck with all their future endeavors. Thank you for all your hard work and passion, Seniors! ❤️🖤🤍</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CtNmzFIxVb9/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 8</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        45</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        0</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/352183455_260631953223499_438263018744322651_n.jpg?_nc_cat=103&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=FhdMlYCjg7UAX-ycohi&#038;_nc_oc=AQlUjgWDHFwddnzyMwen7WTwAhiBwAn6MRbAMj4-vc7pEt-f4IhC9UPklsjXT5P5jzs&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfCwmnk13f4HyUD_nJpbl1CHkzWSQlFrMf4yIZDuAwhMZQ&#038;oe=648B93FB" rel="nofollow noopener" data-lightbox-sbi="" data-title="From @sammamish_choir: Congratulations, Seniors! Such a talented group of young adults that we had the honor of working alongside. We wish them luck with all their future endeavors. Thank you for all your hard work and passion, Seniors! ❤️🖤🤍" data-video="" data-carousel="{&quot;data&quot;:[{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352183455_260631953223499_438263018744322651_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=FhdMlYCjg7UAX-ycohi&amp;_nc_oc=AQlUjgWDHFwddnzyMwen7WTwAhiBwAn6MRbAMj4-vc7pEt-f4IhC9UPklsjXT5P5jzs&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCwmnk13f4HyUD_nJpbl1CHkzWSQlFrMf4yIZDuAwhMZQ&amp;oe=648B93FB&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.29350-15\/352407978_265108766036226_7454604282132273806_n.jpg?_nc_cat=106&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=X9ahNpa6uUsAX_I_rPP&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCaC6BxEa9lUJmp15sUk43SSYIJJkunrwbfa_TWJ1GwSw&amp;oe=648B1CB4&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.29350-15\/351737307_573530058264454_3290996539050516163_n.jpg?_nc_cat=111&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=Xlqpv-km2uoAX-aTXNv&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCaU7hfC-3HQkPEZ3XqC6czb4t3_X383IvHmDQwKRhh8g&amp;oe=648BC6ED&quot;}],&quot;vid_first&quot;:false}" data-id="sbi_18026558206533542" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CtNmzFIxVb9/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CtNmzFIxVb9/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/352183455_260631953223499_438263018744322651_n.jpg?_nc_cat=103&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=FhdMlYCjg7UAX-ycohi&#038;_nc_oc=AQlUjgWDHFwddnzyMwen7WTwAhiBwAn6MRbAMj4-vc7pEt-f4IhC9UPklsjXT5P5jzs&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfCwmnk13f4HyUD_nJpbl1CHkzWSQlFrMf4yIZDuAwhMZQ&#038;oe=648B93FB" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352183455_260631953223499_438263018744322651_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=FhdMlYCjg7UAX-ycohi&amp;_nc_oc=AQlUjgWDHFwddnzyMwen7WTwAhiBwAn6MRbAMj4-vc7pEt-f4IhC9UPklsjXT5P5jzs&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCwmnk13f4HyUD_nJpbl1CHkzWSQlFrMf4yIZDuAwhMZQ&amp;oe=648B93FB&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352183455_260631953223499_438263018744322651_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=FhdMlYCjg7UAX-ycohi&amp;_nc_oc=AQlUjgWDHFwddnzyMwen7WTwAhiBwAn6MRbAMj4-vc7pEt-f4IhC9UPklsjXT5P5jzs&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCwmnk13f4HyUD_nJpbl1CHkzWSQlFrMf4yIZDuAwhMZQ&amp;oe=648B93FB&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352183455_260631953223499_438263018744322651_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352183455_260631953223499_438263018744322651_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="From @sammamish_choir: Congratulations, Seniors! Such a talented group of young adults that we had the honor of working alongside. We wish them luck with all their future endeavors. Thank you for all your hard work and passion, Seniors! ❤️🖤🤍">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                45</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                0</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_carousel sbi_new sbi_transition" id="sbi_17958475751604113" data-date="1686190703" data-numcomments="1"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    <svg class="svg-inline--fa fa-clone fa-w-16 sbi_lightbox_carousel_icon" aria-hidden="true" aria-label="Clone" data-fa-proƒcessed="" data-prefix="far" data-icon="clone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	                <path fill="currentColor" d="M464 0H144c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h320c26.51 0 48-21.49 48-48v-48h48c26.51 0 48-21.49 48-48V48c0-26.51-21.49-48-48-48zM362 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h42v224c0 26.51 21.49 48 48 48h224v42a6 6 0 0 1-6 6zm96-96H150a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h308a6 6 0 0 1 6 6v308a6 6 0 0 1-6 6z"></path>
	            </svg>		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">From @nhs_ntv: Update from the Northwest High School Film Festival. The NTV crew were fortunate to come home with 6 Awards of Excellence. <br><br>1. Studio Compilation - NTV Crew <br><br>2. Tolo Tips - Taylor, Tahmid, Siena<br><br>3. Cry Baby - Marin &amp; Siena <br><br>4. Storage - Taylor, Lucas, Marin<br><br>5. Clown Guy &amp; EW feature - Asian <br><br>6. The group with the hardware <br><br>7. Surprise finale! <br><br>#bellevueschools405 #bellevueschooldistrict #bellevueschooldistrict405 #wearebellevue</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CtNlxaTxD5d/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 8</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        45</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        1</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/352258046_1021336072186155_2520228910560834382_n.jpg?_nc_cat=100&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=j-GXTxQwSAkAX_q-imn&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBOm6hfWYhW4h-HLkE6_V1q-PyzAU84H26rgCyACRdrQw&#038;oe=648CBFD1" rel="nofollow noopener" data-lightbox-sbi="" data-title="From @nhs_ntv: Update from the Northwest High School Film Festival. The NTV crew were fortunate to come home with 6 Awards of Excellence. &lt;br&gt;
&lt;br&gt;
1. Studio Compilation - NTV Crew &lt;br&gt;
&lt;br&gt;
2. Tolo Tips - Taylor, Tahmid, Siena&lt;br&gt;
&lt;br&gt;
3. Cry Baby - Marin &amp; Siena &lt;br&gt;
&lt;br&gt;
4. Storage - Taylor, Lucas, Marin&lt;br&gt;
&lt;br&gt;
5. Clown Guy &amp; EW feature - Asian &lt;br&gt;
&lt;br&gt;
6. The group with the hardware &lt;br&gt;
&lt;br&gt;
7. Surprise finale! &lt;br&gt;
&lt;br&gt;
#bellevueschools405 #bellevueschooldistrict #bellevueschooldistrict405 #wearebellevue" data-video="" data-carousel="{&quot;data&quot;:[{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352258046_1021336072186155_2520228910560834382_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=j-GXTxQwSAkAX_q-imn&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBOm6hfWYhW4h-HLkE6_V1q-PyzAU84H26rgCyACRdrQw&amp;oe=648CBFD1&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.29350-15\/352171485_812917636625553_1511303980110116572_n.jpg?_nc_cat=111&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=597ss7fdWAsAX_tMcBD&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBYSTzJjhVTT25J1T5OUDA0Z16lugk8Fq_osV6Sp_nMTA&amp;oe=648B69AC&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.29350-15\/352409207_805872217617612_145857179072816924_n.jpg?_nc_cat=111&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=X7CtMr8orI4AX-6x2fC&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfD3OGwLmTgSKA1Gc8qBFV7at-Uamo7SfgmEQfhpOcxMeg&amp;oe=648C8F89&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352280655_1009043183461784_1273179239263312147_n.jpg?_nc_cat=107&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=gqIEzDRmKC4AX-I8B2t&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfDMXMOpBNQE4KT73BuJdqEQWbOiRJk7VVWWennM3gBWhQ&amp;oe=648CB60E&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/351963666_825029661850915_5364332708681796235_n.jpg?_nc_cat=102&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=pKKqUh_OVLcAX-acYQ9&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfDrMEZ0GNITLahqrQSislGvNJPgGcIHoLCG-zVBlSDB_A&amp;oe=648BBA70&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/351821620_963067714817251_8862800051341858363_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=sDovPnzWpPcAX9ETODY&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCCw-tS-mJvx_hX4Orxd6eVe2f3KP9J1rDpeuuYwYOHNw&amp;oe=648BC134&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.29350-15\/351703952_147370468340623_2352827603091880126_n.jpg?_nc_cat=101&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=d1049y1yaEEAX9Aw_Il&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBaJW3OZVB1iF78RdQZkCLjgAJKPCxC2sIxUy9V9bSwPQ&amp;oe=648C7AEB&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352227179_2610312122456049_7147565338047648582_n.jpg?_nc_cat=107&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=X89BdlgKx3oAX9xmyAN&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCgJSqiFlGbt0RExCFSw0aNzINH9wzjp-ryNFlp5e1M6A&amp;oe=648C9B52&quot;}],&quot;vid_first&quot;:false}" data-id="sbi_17958475751604113" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CtNlxaTxD5d/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CtNlxaTxD5d/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/352258046_1021336072186155_2520228910560834382_n.jpg?_nc_cat=100&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=j-GXTxQwSAkAX_q-imn&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBOm6hfWYhW4h-HLkE6_V1q-PyzAU84H26rgCyACRdrQw&#038;oe=648CBFD1" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352258046_1021336072186155_2520228910560834382_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=j-GXTxQwSAkAX_q-imn&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBOm6hfWYhW4h-HLkE6_V1q-PyzAU84H26rgCyACRdrQw&amp;oe=648CBFD1&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352258046_1021336072186155_2520228910560834382_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=j-GXTxQwSAkAX_q-imn&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBOm6hfWYhW4h-HLkE6_V1q-PyzAU84H26rgCyACRdrQw&amp;oe=648CBFD1&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352258046_1021336072186155_2520228910560834382_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352258046_1021336072186155_2520228910560834382_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="From @nhs_ntv: Update from the Northwest High School Film Festival. The NTV crew were fortunate to come home with 6 Awards of Excellence. 

1. Studio Compilation - NTV Crew 

2. Tolo Tips - Taylor, Tahmid, Siena

3. Cry Baby - Marin &amp; Siena 

4. Storage - Taylor, Lucas, Marin

5. Clown Guy &amp; EW feature - Asian 

6. The group with the hardware 

7. Surprise finale! 

#bellevueschools405 #bellevueschooldistrict #bellevueschooldistrict405 #wearebellevue">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                45</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                1</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_carousel sbi_new sbi_transition" id="sbi_18005214433762562" data-date="1686172871" data-numcomments="1"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    <svg class="svg-inline--fa fa-clone fa-w-16 sbi_lightbox_carousel_icon" aria-hidden="true" aria-label="Clone" data-fa-proƒcessed="" data-prefix="far" data-icon="clone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	                <path fill="currentColor" d="M464 0H144c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h320c26.51 0 48-21.49 48-48v-48h48c26.51 0 48-21.49 48-48V48c0-26.51-21.49-48-48-48zM362 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h42v224c0 26.51 21.49 48 48 48h224v42a6 6 0 0 1-6 6zm96-96H150a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h308a6 6 0 0 1 6 6v308a6 6 0 0 1-6 6z"></path>
	            </svg>		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">Congratulations to the 2022-2023 WIAA Scholastic Cup Champions! 🏆<br><br>4A: #1 Newport <br>3A: #2 Bellevue <br>2A: #3 Sammamish<br><br>The Scholastic Cup recognizes the combined athletic and academic achievements of @wiaawa member schools. Congratulations, to our incredible student athletes!</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CtNDwmISKOF/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 7</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        91</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        1</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/352127905_1655500608226785_1023903372736001283_n.jpg?_nc_cat=105&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=k6SojIETfZwAX-9xLyl&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBMiFr8F4Ibv26TNwE7_kvskjWf7cNcxDONlrhn82dUMg&#038;oe=648BEE0E" rel="nofollow noopener" data-lightbox-sbi="" data-title="Congratulations to the 2022-2023 WIAA Scholastic Cup Champions! 🏆&lt;br&gt;
&lt;br&gt;
4A: #1 Newport &lt;br&gt;
3A: #2 Bellevue &lt;br&gt;
2A: #3 Sammamish&lt;br&gt;
&lt;br&gt;
The Scholastic Cup recognizes the combined athletic and academic achievements of @wiaawa member schools. Congratulations, to our incredible student athletes!" data-video="" data-carousel="{&quot;data&quot;:[{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352127905_1655500608226785_1023903372736001283_n.jpg?_nc_cat=105&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=k6SojIETfZwAX-9xLyl&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBMiFr8F4Ibv26TNwE7_kvskjWf7cNcxDONlrhn82dUMg&amp;oe=648BEE0E&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.29350-15\/351788813_1378483086054878_5849387558022773706_n.jpg?_nc_cat=101&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=aadTPmPC4cAAX__Wd4a&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfAyf998z2YogpWOKsqO4elkqsWVVNjlsKVp68c5O0xChQ&amp;oe=648C8C16&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/351749602_615215027246410_4082955170195407097_n.jpg?_nc_cat=107&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=c170zElb-G8AX_Yk-L5&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfDjytqfgDfpMs_dYMS6uWGli_cFTYwU1vSJdxNsIW9OAA&amp;oe=648B1907&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.29350-15\/351854086_214989251362850_8783817546385433983_n.jpg?_nc_cat=109&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=2afNNS_VQSMAX_HHtab&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCXioKk00dI89zc9ZqPZMm-u-8JuO-x8so-pDSoeyfIfA&amp;oe=648C8B76&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352437630_645170120813675_1906545669773850674_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=zz51Kg2YrZgAX8RnZel&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfAi5B4Xx-6eS2AtbLUh4yABq-KZKhSf-R3bkLSEN9tLjw&amp;oe=648C1F98&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352247817_3184554778503629_4451412641385194260_n.jpg?_nc_cat=102&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=jX4cMu2bJ_oAX-nmzOD&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfAJsWhJJeuQ9gczPRFF1XaZys4p5dYmlkLpXgOiG04ZZg&amp;oe=648BB9E0&quot;}],&quot;vid_first&quot;:false}" data-id="sbi_18005214433762562" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CtNDwmISKOF/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CtNDwmISKOF/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/352127905_1655500608226785_1023903372736001283_n.jpg?_nc_cat=105&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=k6SojIETfZwAX-9xLyl&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBMiFr8F4Ibv26TNwE7_kvskjWf7cNcxDONlrhn82dUMg&#038;oe=648BEE0E" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352127905_1655500608226785_1023903372736001283_n.jpg?_nc_cat=105&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=k6SojIETfZwAX-9xLyl&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBMiFr8F4Ibv26TNwE7_kvskjWf7cNcxDONlrhn82dUMg&amp;oe=648BEE0E&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/352127905_1655500608226785_1023903372736001283_n.jpg?_nc_cat=105&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=k6SojIETfZwAX-9xLyl&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBMiFr8F4Ibv26TNwE7_kvskjWf7cNcxDONlrhn82dUMg&amp;oe=648BEE0E&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352127905_1655500608226785_1023903372736001283_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352127905_1655500608226785_1023903372736001283_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="Congratulations to the 2022-2023 WIAA Scholastic Cup Champions! 🏆

4A: #1 Newport 
3A: #2 Bellevue 
2A: #3 Sammamish

The Scholastic Cup recognizes the combined athletic and academic achievements of @wiaawa member schools. Congratulations, to our incredible student athletes!">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                91</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                1</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_image sbi_new sbi_transition" id="sbi_18296683450108156" data-date="1686171939" data-numcomments="0"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">From @newportyearbook23: So gorgeous. 💙<br><br>#Classof2023</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CtNB-4Ny8AL/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 7</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        36</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        0</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/351852665_815723426568702_2336624768425015845_n.jpg?_nc_cat=110&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=eRwWzn_6hzMAX_52qz8&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfC1QyfolpOXThIiYvHcs_h9Ujlclvph8bcrtMlZ-anIRg&#038;oe=648B9131" rel="nofollow noopener" data-lightbox-sbi="" data-title="From @newportyearbook23: So gorgeous. 💙&lt;br&gt;
&lt;br&gt;
#Classof2023" data-video="" data-carousel="" data-id="sbi_18296683450108156" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CtNB-4Ny8AL/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CtNB-4Ny8AL/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/351852665_815723426568702_2336624768425015845_n.jpg?_nc_cat=110&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=eRwWzn_6hzMAX_52qz8&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfC1QyfolpOXThIiYvHcs_h9Ujlclvph8bcrtMlZ-anIRg&#038;oe=648B9131" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/351852665_815723426568702_2336624768425015845_n.jpg?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=eRwWzn_6hzMAX_52qz8&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfC1QyfolpOXThIiYvHcs_h9Ujlclvph8bcrtMlZ-anIRg&amp;oe=648B9131&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/351852665_815723426568702_2336624768425015845_n.jpg?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=eRwWzn_6hzMAX_52qz8&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfC1QyfolpOXThIiYvHcs_h9Ujlclvph8bcrtMlZ-anIRg&amp;oe=648B9131&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/351852665_815723426568702_2336624768425015845_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/351852665_815723426568702_2336624768425015845_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="From @newportyearbook23: So gorgeous. 💙

#Classof2023">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                36</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                0</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_carousel sbi_new sbi_transition" id="sbi_17988201178910982" data-date="1686109894" data-numcomments="0"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    <svg class="svg-inline--fa fa-clone fa-w-16 sbi_lightbox_carousel_icon" aria-hidden="true" aria-label="Clone" data-fa-proƒcessed="" data-prefix="far" data-icon="clone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	                <path fill="currentColor" d="M464 0H144c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h320c26.51 0 48-21.49 48-48v-48h48c26.51 0 48-21.49 48-48V48c0-26.51-21.49-48-48-48zM362 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h42v224c0 26.51 21.49 48 48 48h224v42a6 6 0 0 1-6 6zm96-96H150a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h308a6 6 0 0 1 6 6v308a6 6 0 0 1-6 6z"></path>
	            </svg>		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">Congratulations to the Class of 2023! For their last full week of school, we`re celebrating our graduating seniors! Take a look back through these unforgettable moments highlighting our amazing Class of 2023! 🎓❤️ <br><br>#WeAreBellevue #BSDSeniorSpotlight #BSDClassof2023</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CtLLovUM8z5/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 7</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        121</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        0</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-1.cdninstagram.com/v/t51.2885-15/352275375_1993165761031840_9171230216684949170_n.jpg?_nc_cat=106&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=096YGtdXfT0AX8DdfCB&#038;_nc_ht=scontent-ord5-1.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBVwyG8B6EJTdFWoUHpNE0vGV4Hz4xT7UOUAv_5Qq5PhQ&#038;oe=648C63B0" rel="nofollow noopener" data-lightbox-sbi="" data-title="Congratulations to the Class of 2023! For their last full week of school, we&#039;re celebrating our graduating seniors! Take a look back through these unforgettable moments highlighting our amazing Class of 2023! 🎓❤️ &lt;br&gt;
&lt;br&gt;
#WeAreBellevue #BSDSeniorSpotlight #BSDClassof2023" data-video="" data-carousel="{&quot;data&quot;:[{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/352275375_1993165761031840_9171230216684949170_n.jpg?_nc_cat=106&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=096YGtdXfT0AX8DdfCB&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBVwyG8B6EJTdFWoUHpNE0vGV4Hz4xT7UOUAv_5Qq5PhQ&amp;oe=648C63B0&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/352168808_3976862519206742_3493959321738097374_n.jpg?_nc_cat=111&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=bOL5KTvtZGQAX_V46AJ&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfA1qi9UOfcTG2UqpYBdhRGDh38E-OWdyYsfmvu30tLrLg&amp;oe=648C1C49&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/351703957_793821198754635_6497082486326670020_n.jpg?_nc_cat=102&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=8lqSyDWmGiMAX-5jB9t&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfDzZbL7Sfyfa1CSHlgba84YH0YlyGm5JgpAcHrxN1m0uw&amp;oe=648CAD0D&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/352206597_188757174141305_6652287177322911428_n.jpg?_nc_cat=107&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=cJSKYdXsLcgAX8GjMd8&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCwQn9nAQyXPoEpu-YlODs_Zs9mkjH8dfYHGSGzm_eaZA&amp;oe=648C65C8&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/351430872_2736425873162075_2326476906824359310_n.jpg?_nc_cat=106&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=ClGENNmW-H4AX8EYlsE&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfAeS_V2Mpn22cmm1ty7GqvYGsU-OUpuK-2wP_3i1qNPSw&amp;oe=648BF390&quot;}],&quot;vid_first&quot;:false}" data-id="sbi_17988201178910982" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CtLLovUM8z5/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CtLLovUM8z5/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-1.cdninstagram.com/v/t51.2885-15/352275375_1993165761031840_9171230216684949170_n.jpg?_nc_cat=106&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=096YGtdXfT0AX8DdfCB&#038;_nc_ht=scontent-ord5-1.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBVwyG8B6EJTdFWoUHpNE0vGV4Hz4xT7UOUAv_5Qq5PhQ&#038;oe=648C63B0" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/352275375_1993165761031840_9171230216684949170_n.jpg?_nc_cat=106&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=096YGtdXfT0AX8DdfCB&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBVwyG8B6EJTdFWoUHpNE0vGV4Hz4xT7UOUAv_5Qq5PhQ&amp;oe=648C63B0&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/352275375_1993165761031840_9171230216684949170_n.jpg?_nc_cat=106&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=096YGtdXfT0AX8DdfCB&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBVwyG8B6EJTdFWoUHpNE0vGV4Hz4xT7UOUAv_5Qq5PhQ&amp;oe=648C63B0&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352275375_1993165761031840_9171230216684949170_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352275375_1993165761031840_9171230216684949170_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="Congratulations to the Class of 2023! For their last full week of school, we&#039;re celebrating our graduating seniors! Take a look back through these unforgettable moments highlighting our amazing Class of 2023! 🎓❤️ 

#WeAreBellevue #BSDSeniorSpotlight #BSDClassof2023">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                121</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                0</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_carousel sbi_new sbi_transition" id="sbi_17984184047153619" data-date="1686109494" data-numcomments="0"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    <svg class="svg-inline--fa fa-clone fa-w-16 sbi_lightbox_carousel_icon" aria-hidden="true" aria-label="Clone" data-fa-proƒcessed="" data-prefix="far" data-icon="clone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	                <path fill="currentColor" d="M464 0H144c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h320c26.51 0 48-21.49 48-48v-48h48c26.51 0 48-21.49 48-48V48c0-26.51-21.49-48-48-48zM362 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h42v224c0 26.51 21.49 48 48 48h224v42a6 6 0 0 1-6 6zm96-96H150a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h308a6 6 0 0 1 6 6v308a6 6 0 0 1-6 6z"></path>
	            </svg>		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">Congratulations to the Class of 2023! For their last full week of school, we`re celebrating our graduating seniors! Take a look back through these unforgettable moments highlighting our amazing Class of 2023! 🎓❤️<br><br>#WeAreBellevue #BSDSeniorSpotlight #BSDClassof2023</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CtLK3zvsW5d/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 7</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        68</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        0</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-1.cdninstagram.com/v/t51.2885-15/351441965_669199031887547_5971191712398592315_n.jpg?_nc_cat=111&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=Q0oo3WWkUFsAX_2jTU9&#038;_nc_ht=scontent-ord5-1.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfABr4D4eqnlJKlJz5hYS7tvaevCxl9y_3jKfMjQTwXLbg&#038;oe=648CC6CF" rel="nofollow noopener" data-lightbox-sbi="" data-title="Congratulations to the Class of 2023! For their last full week of school, we&#039;re celebrating our graduating seniors! Take a look back through these unforgettable moments highlighting our amazing Class of 2023! 🎓❤️&lt;br&gt;
&lt;br&gt;
#WeAreBellevue #BSDSeniorSpotlight #BSDClassof2023" data-video="" data-carousel="{&quot;data&quot;:[{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/351441965_669199031887547_5971191712398592315_n.jpg?_nc_cat=111&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=Q0oo3WWkUFsAX_2jTU9&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfABr4D4eqnlJKlJz5hYS7tvaevCxl9y_3jKfMjQTwXLbg&amp;oe=648CC6CF&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/352552379_760183549196800_4542275932756885956_n.jpg?_nc_cat=109&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=2cmjLtkfPmMAX93fNSm&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfB02iVVPP_HN2onGwPlsejVzNLjvQfh84mIXbheEiWmAQ&amp;oe=648C4E1D&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/351429289_797301731996979_4415842060182195678_n.jpg?_nc_cat=109&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=2xUcaxX3CNcAX8pYepq&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCk_kEkRPWAKLBgZOnelrfueJpY_bqYJBdHLN6AVMFTBw&amp;oe=648B9722&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/352370078_1637139003358204_4428223211475854017_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=EpdFMM0q2A4AX-fC9nK&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBP_jpfLebVP3sI3bJGAbffZ6TYlbkkaSgINfMww3vcOQ&amp;oe=648C7C15&quot;}],&quot;vid_first&quot;:false}" data-id="sbi_17984184047153619" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CtLK3zvsW5d/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CtLK3zvsW5d/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-1.cdninstagram.com/v/t51.2885-15/351441965_669199031887547_5971191712398592315_n.jpg?_nc_cat=111&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=Q0oo3WWkUFsAX_2jTU9&#038;_nc_ht=scontent-ord5-1.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfABr4D4eqnlJKlJz5hYS7tvaevCxl9y_3jKfMjQTwXLbg&#038;oe=648CC6CF" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/351441965_669199031887547_5971191712398592315_n.jpg?_nc_cat=111&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=Q0oo3WWkUFsAX_2jTU9&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfABr4D4eqnlJKlJz5hYS7tvaevCxl9y_3jKfMjQTwXLbg&amp;oe=648CC6CF&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/351441965_669199031887547_5971191712398592315_n.jpg?_nc_cat=111&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=Q0oo3WWkUFsAX_2jTU9&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfABr4D4eqnlJKlJz5hYS7tvaevCxl9y_3jKfMjQTwXLbg&amp;oe=648CC6CF&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/351441965_669199031887547_5971191712398592315_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/351441965_669199031887547_5971191712398592315_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="Congratulations to the Class of 2023! For their last full week of school, we&#039;re celebrating our graduating seniors! Take a look back through these unforgettable moments highlighting our amazing Class of 2023! 🎓❤️

#WeAreBellevue #BSDSeniorSpotlight #BSDClassof2023">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                68</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                0</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_image sbi_new sbi_transition" id="sbi_17986385843104513" data-date="1686098645" data-numcomments="0"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">Congratulations to Rebecca Wu, the 2023 Doodle for Google National Winner! 🤩🎨🎉 <br><br>Rebecca, a 6th grader from International School, won the Google for Doodle contest this year with her Doodle titled, “My Sweetest Memories,” which is featured on the Google homepage today! Google is generously awarding Rebecca with a $30,000 college scholarship and a $50,000 technology award for International School! 👏 👏 👏<br><br>Rebecca and her family stopped by the Today Show in New York to reveal her winning drawing. 😃☕ <br><br>Thank you, Google, for supporting the arts and technology! And thank you to everyone who voted for Rebecca`s Doodle! <br><br>Congratulations, Rebecca! We are so proud of you! And congratulations to the International School community! 💚</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CtK2LbmstkB/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 7</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        152</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        0</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-2.cdninstagram.com/v/t51.2885-15/352236327_552979756813997_2572564983005849532_n.jpg?_nc_cat=100&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=6j6W-4613DAAX8zdObH&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBTnxHjIdNWp1mLsKhA9sMsZ-QYGzcHBn6TrLSUvrG11Q&#038;oe=648BA4D4" rel="nofollow noopener" data-lightbox-sbi="" data-title="Congratulations to Rebecca Wu, the 2023 Doodle for Google National Winner! 🤩🎨🎉 &lt;br&gt;
&lt;br&gt;
Rebecca, a 6th grader from International School, won the Google for Doodle contest this year with her Doodle titled, “My Sweetest Memories,” which is featured on the Google homepage today! Google is generously awarding Rebecca with a $30,000 college scholarship and a $50,000 technology award for International School! 👏 👏 👏&lt;br&gt;
&lt;br&gt;
Rebecca and her family stopped by the Today Show in New York to reveal her winning drawing. 😃☕ &lt;br&gt;
&lt;br&gt;
Thank you, Google, for supporting the arts and technology! And thank you to everyone who voted for Rebecca&#039;s Doodle! &lt;br&gt;
&lt;br&gt;
Congratulations, Rebecca! We are so proud of you! And congratulations to the International School community! 💚" data-video="" data-carousel="" data-id="sbi_17986385843104513" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CtK2LbmstkB/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CtK2LbmstkB/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-2.cdninstagram.com/v/t51.2885-15/352236327_552979756813997_2572564983005849532_n.jpg?_nc_cat=100&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=6j6W-4613DAAX8zdObH&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBTnxHjIdNWp1mLsKhA9sMsZ-QYGzcHBn6TrLSUvrG11Q&#038;oe=648BA4D4" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/352236327_552979756813997_2572564983005849532_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=6j6W-4613DAAX8zdObH&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBTnxHjIdNWp1mLsKhA9sMsZ-QYGzcHBn6TrLSUvrG11Q&amp;oe=648BA4D4&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/352236327_552979756813997_2572564983005849532_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=6j6W-4613DAAX8zdObH&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBTnxHjIdNWp1mLsKhA9sMsZ-QYGzcHBn6TrLSUvrG11Q&amp;oe=648BA4D4&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352236327_552979756813997_2572564983005849532_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/352236327_552979756813997_2572564983005849532_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="Congratulations to Rebecca Wu, the 2023 Doodle for Google National Winner! 🤩🎨🎉 

Rebecca, a 6th grader from International School, won the Google for Doodle contest this year with her Doodle titled, “My Sweetest Memories,” which is featured on the Google homepage today! Google is generously awarding Rebecca with a $30,000 college scholarship and a $50,000 technology award for International School! 👏 👏 👏

Rebecca and her family stopped by the Today Show in New York to reveal her winning drawing. 😃☕ 

Thank you, Google, for supporting the arts and technology! And thank you to everyone who voted for Rebecca&#039;s Doodle! 

Congratulations, Rebecca! We are so proud of you! And congratulations to the International School community! 💚">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                152</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                0</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_image sbi_new sbi_transition" id="sbi_17966722430303219" data-date="1685747884" data-numcomments="2"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">Happy Friday, BSD! This moment of joy is brought to you by the superstar staff of Stevenson Elementary and their puppets! ⭐ They stand outside and say goodbye to their students every Friday! 😍 Hope everyone has a great weekend! ☀️<br><br>#WeAreBellevue #Puppets #Joy</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CtAZKBJNicJ/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 2</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        75</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        2</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-1.cdninstagram.com/v/t51.2885-15/350846306_1048037782825954_895748716231647280_n.jpg?_nc_cat=109&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=7P1VIrh37hQAX-ggAIX&#038;_nc_ht=scontent-ord5-1.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfCbKwn9of--BJynV01_2_P6zXMddRxYMbHCgJbmJNJw9w&#038;oe=648B9380" rel="nofollow noopener" data-lightbox-sbi="" data-title="Happy Friday, BSD! This moment of joy is brought to you by the superstar staff of Stevenson Elementary and their puppets! ⭐ They stand outside and say goodbye to their students every Friday! 😍 Hope everyone has a great weekend! ☀️&lt;br&gt;
&lt;br&gt;
#WeAreBellevue #Puppets #Joy" data-video="" data-carousel="" data-id="sbi_17966722430303219" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CtAZKBJNicJ/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CtAZKBJNicJ/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-1.cdninstagram.com/v/t51.2885-15/350846306_1048037782825954_895748716231647280_n.jpg?_nc_cat=109&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=7P1VIrh37hQAX-ggAIX&#038;_nc_ht=scontent-ord5-1.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfCbKwn9of--BJynV01_2_P6zXMddRxYMbHCgJbmJNJw9w&#038;oe=648B9380" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/350846306_1048037782825954_895748716231647280_n.jpg?_nc_cat=109&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=7P1VIrh37hQAX-ggAIX&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCbKwn9of--BJynV01_2_P6zXMddRxYMbHCgJbmJNJw9w&amp;oe=648B9380&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/350846306_1048037782825954_895748716231647280_n.jpg?_nc_cat=109&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=7P1VIrh37hQAX-ggAIX&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCbKwn9of--BJynV01_2_P6zXMddRxYMbHCgJbmJNJw9w&amp;oe=648B9380&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/350846306_1048037782825954_895748716231647280_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/350846306_1048037782825954_895748716231647280_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="Happy Friday, BSD! This moment of joy is brought to you by the superstar staff of Stevenson Elementary and their puppets! ⭐ They stand outside and say goodbye to their students every Friday! 😍 Hope everyone has a great weekend! ☀️

#WeAreBellevue #Puppets #Joy">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                75</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                2</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_carousel sbi_new sbi_transition" id="sbi_18019125253578607" data-date="1685744990" data-numcomments="4"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    <svg class="svg-inline--fa fa-clone fa-w-16 sbi_lightbox_carousel_icon" aria-hidden="true" aria-label="Clone" data-fa-proƒcessed="" data-prefix="far" data-icon="clone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	                <path fill="currentColor" d="M464 0H144c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h320c26.51 0 48-21.49 48-48v-48h48c26.51 0 48-21.49 48-48V48c0-26.51-21.49-48-48-48zM362 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h42v224c0 26.51 21.49 48 48 48h224v42a6 6 0 0 1-6 6zm96-96H150a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h308a6 6 0 0 1 6 6v308a6 6 0 0 1-6 6z"></path>
	            </svg>		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">From @bellevuefiredept: Juniors and Seniors at @bellevueschools405 Newport High School participated in a distracted driving drill earlier this morning. Along with @bellevue.police.department,<br>@wastatepatrol, @trimedambulance and actors from the drama club, we simulated the very real consequences of driving distracted or under the influence.<br><br>Approximately 4,000 teenagers are killed, and over 400K are seriously injured, each year in motor-vehicle collisions. 75% of those fatalities are caused by distracted driving.<br><br>We can...no. we MUST do better. Adults, our youths eyes are on us. We must model the behavior we want to see in them.<br><br>Visit our bio for safe driving tips and to sign the safe driving pledge from Impact Teen Drivers.</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CtATpBuvgyp/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 2</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        287</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        4</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/351278286_1703259016774296_7940746603542312036_n.jpg?_nc_cat=100&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=UdNtBRc7_zoAX9eRoN9&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfCx9VROuSzKLSkFdOBnYwlbt4JfQmejXLtsP3xws9zbaw&#038;oe=648C73F1" rel="nofollow noopener" data-lightbox-sbi="" data-title="From @bellevuefiredept: Juniors and Seniors at @bellevueschools405 Newport High School participated in a distracted driving drill earlier this morning. Along with @bellevue.police.department,&lt;br&gt;
@wastatepatrol, @trimedambulance and actors from the drama club, we simulated the very real consequences of driving distracted or under the influence.&lt;br&gt;
&lt;br&gt;
Approximately 4,000 teenagers are killed, and over 400K are seriously injured, each year in motor-vehicle collisions. 75% of those fatalities are caused by distracted driving.&lt;br&gt;
&lt;br&gt;
We can...no. we MUST do better. Adults, our youths eyes are on us. We must model the behavior we want to see in them.&lt;br&gt;
&lt;br&gt;
Visit our bio for safe driving tips and to sign the safe driving pledge from Impact Teen Drivers." data-video="" data-carousel="{&quot;data&quot;:[{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/351278286_1703259016774296_7940746603542312036_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=UdNtBRc7_zoAX9eRoN9&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCx9VROuSzKLSkFdOBnYwlbt4JfQmejXLtsP3xws9zbaw&amp;oe=648C73F1&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/350849363_558386009578434_4660777609008379892_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=HwjpkUkULeoAX9nj4vt&amp;_nc_oc=AQm1xZHlu-mbZTgq-9aLATDxYAM7CHd6AtqmEYfD9K60xQMNxgrnRwTKpLSWxxGTtRg&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfDGM10TfUWIWGO-pXCxs5ooDv-Mr8HgC9UCVTQoVd4CPQ&amp;oe=648C993F&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/350646790_110123788769461_6608923574315205891_n.jpg?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=W4lQ_AkcwA0AX8Non63&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBt32Un62f4iXYQEvn0YVIIGmVnD4eosVbnNUs27QfXpg&amp;oe=648CBDAD&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.29350-15\/350867531_482501030733123_3535709334900634956_n.jpg?_nc_cat=111&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=2RYlnwDxqxAAX_fyEr5&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfB59gzl9CuLwETzDUyiWAOqEvOB6xtBaWOCitCpro7KdA&amp;oe=648BF3E5&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.29350-15\/350614028_243164834988989_6571540954829823640_n.jpg?_nc_cat=108&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=ylW30XzeviUAX92tcyn&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfAWSWGGELvWyGvbd_o5qeSk4sJy7-W9reUtXI3HtoQSgA&amp;oe=648B9F26&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/351197894_930142114863081_1367765769571708990_n.jpg?_nc_cat=102&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=w0x2KtJ0OiMAX-9O5we&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBT5gezY0vREuSiSvtNrP3VuY8ZS9FfBOewT67Tx3-Hvg&amp;oe=648C9713&quot;}],&quot;vid_first&quot;:false}" data-id="sbi_18019125253578607" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CtATpBuvgyp/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CtATpBuvgyp/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/351278286_1703259016774296_7940746603542312036_n.jpg?_nc_cat=100&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=UdNtBRc7_zoAX9eRoN9&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfCx9VROuSzKLSkFdOBnYwlbt4JfQmejXLtsP3xws9zbaw&#038;oe=648C73F1" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/351278286_1703259016774296_7940746603542312036_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=UdNtBRc7_zoAX9eRoN9&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCx9VROuSzKLSkFdOBnYwlbt4JfQmejXLtsP3xws9zbaw&amp;oe=648C73F1&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/351278286_1703259016774296_7940746603542312036_n.jpg?_nc_cat=100&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=UdNtBRc7_zoAX9eRoN9&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCx9VROuSzKLSkFdOBnYwlbt4JfQmejXLtsP3xws9zbaw&amp;oe=648C73F1&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/351278286_1703259016774296_7940746603542312036_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/351278286_1703259016774296_7940746603542312036_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="From @bellevuefiredept: Juniors and Seniors at @bellevueschools405 Newport High School participated in a distracted driving drill earlier this morning. Along with @bellevue.police.department,
@wastatepatrol, @trimedambulance and actors from the drama club, we simulated the very real consequences of driving distracted or under the influence.

Approximately 4,000 teenagers are killed, and over 400K are seriously injured, each year in motor-vehicle collisions. 75% of those fatalities are caused by distracted driving.

We can...no. we MUST do better. Adults, our youths eyes are on us. We must model the behavior we want to see in them.

Visit our bio for safe driving tips and to sign the safe driving pledge from Impact Teen Drivers.">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                287</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                4</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_image sbi_new sbi_transition" id="sbi_18033581572496909" data-date="1685744623" data-numcomments="1"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">From @wilburtonlibrary: Celebrating #pridemonth 🌈 with some new additions to our collection and display this year! #readingwolves #readwithpride 🏳️‍🌈<br><br>#WeAreBellevue</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CtAS8MLP8F-/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 2</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        46</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        1</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-1.cdninstagram.com/v/t51.29350-15/350727301_1331702644077346_706045633063365430_n.jpg?_nc_cat=108&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=Kb4bc0kNMkUAX9RwK6U&#038;_nc_ht=scontent-ord5-1.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfCaBL-daklFo1ryYSbwPeUKk7zraVfBa4Grh4O6ZwCuBQ&#038;oe=648BF16B" rel="nofollow noopener" data-lightbox-sbi="" data-title="From @wilburtonlibrary: Celebrating #pridemonth 🌈 with some new additions to our collection and display this year! #readingwolves #readwithpride 🏳️‍🌈&lt;br&gt;
&lt;br&gt;
#WeAreBellevue" data-video="" data-carousel="" data-id="sbi_18033581572496909" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CtAS8MLP8F-/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CtAS8MLP8F-/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-1.cdninstagram.com/v/t51.29350-15/350727301_1331702644077346_706045633063365430_n.jpg?_nc_cat=108&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=Kb4bc0kNMkUAX9RwK6U&#038;_nc_ht=scontent-ord5-1.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfCaBL-daklFo1ryYSbwPeUKk7zraVfBa4Grh4O6ZwCuBQ&#038;oe=648BF16B" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.29350-15\/350727301_1331702644077346_706045633063365430_n.jpg?_nc_cat=108&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=Kb4bc0kNMkUAX9RwK6U&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCaBL-daklFo1ryYSbwPeUKk7zraVfBa4Grh4O6ZwCuBQ&amp;oe=648BF16B&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.29350-15\/350727301_1331702644077346_706045633063365430_n.jpg?_nc_cat=108&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=Kb4bc0kNMkUAX9RwK6U&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCaBL-daklFo1ryYSbwPeUKk7zraVfBa4Grh4O6ZwCuBQ&amp;oe=648BF16B&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/350727301_1331702644077346_706045633063365430_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/350727301_1331702644077346_706045633063365430_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="From @wilburtonlibrary: Celebrating #pridemonth 🌈 with some new additions to our collection and display this year! #readingwolves #readwithpride 🏳️‍🌈

#WeAreBellevue">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                46</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                1</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_video sbi_new sbi_transition" id="sbi_17938351067663416" data-date="1685680042" data-numcomments="0"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    		    <svg style="color: rgba(255,255,255,1)" class="svg-inline--fa fa-play fa-w-14 sbi_playbtn" aria-label="Play" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="play" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path></svg>
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">From @bellevueasb: COME TO THE “BELLEVUE BEACH BASH” ASSEMBLY THIS FRIDAY FOR A CLASSIC SHOWDOWN BETWEEN TEACHERS VS. STUDENTS IN A BASKETBALL GAME…<br><br>#StudentsvsTeachers #Basketball #WeAreBellevue</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/reel/Cs-XFEGNqwU/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 2</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        42</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        0</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-2.cdninstagram.com/v/t51.36329-15/350511261_560863259573515_8975321567468387680_n.jpg?_nc_cat=110&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=UDrrBLp8ZtUAX_slplJ&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBX24OWqLwXR5SnTVacZFcW3zvciJmPp3JvIToUKPb92A&#038;oe=648C5C77" rel="nofollow noopener" data-lightbox-sbi="" data-title="From @bellevueasb: COME TO THE “BELLEVUE BEACH BASH” ASSEMBLY THIS FRIDAY FOR A CLASSIC SHOWDOWN BETWEEN TEACHERS VS. STUDENTS IN A BASKETBALL GAME…&lt;br&gt;
&lt;br&gt;
#StudentsvsTeachers #Basketball #WeAreBellevue" data-video="https://scontent-ord5-2.cdninstagram.com/o1/v/t16/f1/m82/A846854F3F8C0E31710BA8AB2FC41B92_video_dashinit.mp4?efg=eyJ2ZW5jb2RlX3RhZyI6InZ0c192b2RfdXJsZ2VuLjg4Ni5jbGlwcyJ9&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;_nc_cat=107&amp;vs=941023246883170_2901230659&amp;_nc_vs=HBksFQIYT2lnX3hwdl9yZWVsc19wZXJtYW5lbnRfcHJvZC9BODQ2ODU0RjNGOEMwRTMxNzEwQkE4QUIyRkM0MUI5Ml92aWRlb19kYXNoaW5pdC5tcDQVAALIAQAVABgkR0x3TzhCUW94UmVDc1VRREFMakIyOXF3alpaNmJxX0VBQUFGFQICyAEAKAAYABsBiAd1c2Vfb2lsATEVAAAm2oLx5%2FqVzz8VAigCQzMsF0BGxDlYEGJOGBJkYXNoX2Jhc2VsaW5lXzFfdjERAHUAAA%3D%3D&amp;ccb=9-4&amp;oh=00_AfB9_ngZct2iBhgIT2TG9fLK8qhinom6E237UQwElwzyDg&amp;oe=648843E5&amp;_nc_sid=c07a80&amp;_nc_rid=5506ecf3ad" data-carousel="" data-id="sbi_17938351067663416" data-user="bellevueschools405" data-url="https://www.instagram.com/reel/Cs-XFEGNqwU/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="reels" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				    <svg style="color: rgba(255,255,255,1)" class="svg-inline--fa fa-play fa-w-14 sbi_playbtn" aria-label="Play" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="play" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path></svg>                </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/reel/Cs-XFEGNqwU/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-2.cdninstagram.com/v/t51.36329-15/350511261_560863259573515_8975321567468387680_n.jpg?_nc_cat=110&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=UDrrBLp8ZtUAX_slplJ&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBX24OWqLwXR5SnTVacZFcW3zvciJmPp3JvIToUKPb92A&#038;oe=648C5C77" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.36329-15\/350511261_560863259573515_8975321567468387680_n.jpg?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=UDrrBLp8ZtUAX_slplJ&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBX24OWqLwXR5SnTVacZFcW3zvciJmPp3JvIToUKPb92A&amp;oe=648C5C77&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.36329-15\/350511261_560863259573515_8975321567468387680_n.jpg?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=UDrrBLp8ZtUAX_slplJ&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBX24OWqLwXR5SnTVacZFcW3zvciJmPp3JvIToUKPb92A&amp;oe=648C5C77&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/350511261_560863259573515_8975321567468387680_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/350511261_560863259573515_8975321567468387680_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="From @bellevueasb: COME TO THE “BELLEVUE BEACH BASH” ASSEMBLY THIS FRIDAY FOR A CLASSIC SHOWDOWN BETWEEN TEACHERS VS. STUDENTS IN A BASKETBALL GAME…

#StudentsvsTeachers #Basketball #WeAreBellevue">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                42</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                0</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_carousel sbi_new sbi_transition" id="sbi_18005840323697968" data-date="1685592355" data-numcomments="0"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    <svg class="svg-inline--fa fa-clone fa-w-16 sbi_lightbox_carousel_icon" aria-hidden="true" aria-label="Clone" data-fa-proƒcessed="" data-prefix="far" data-icon="clone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	                <path fill="currentColor" d="M464 0H144c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h320c26.51 0 48-21.49 48-48v-48h48c26.51 0 48-21.49 48-48V48c0-26.51-21.49-48-48-48zM362 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h42v224c0 26.51 21.49 48 48 48h224v42a6 6 0 0 1-6 6zm96-96H150a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h308a6 6 0 0 1 6 6v308a6 6 0 0 1-6 6z"></path>
	            </svg>		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">Dr. Kelly Aramaki, BSD`s incoming superintendent, joined students and staff at Tyee Middle School to celebrate Asian American, Native Hawaiian, yand Pacific Islander Heritage Month. Kung fu and martial arts master teacher, David Leong, visited Tyee and taught students how to do a traditional lion dance. Dr. Aramaki was happy to see the students so engaged in the cultural activity! The students learned so much and had a lot of fun! <br><br>#WeAreBellevue #AANHPIHeritageMonth #AAPIHeritageMonth</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/Cs7wgdzuruN/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        Jun 1</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        72</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        0</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-1.cdninstagram.com/v/t51.2885-15/350615789_1379920095950467_7294868341909053358_n.jpg?_nc_cat=111&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=m_-AO2wmEnoAX-Y-kWP&#038;_nc_ht=scontent-ord5-1.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfApN5TYDsXWj3vBwt49iYM07TV5EcAfCrHPa3OGtsUD6A&#038;oe=648C4BEB" rel="nofollow noopener" data-lightbox-sbi="" data-title="Dr. Kelly Aramaki, BSD&#039;s incoming superintendent, joined students and staff at Tyee Middle School to celebrate Asian American, Native Hawaiian, yand Pacific Islander Heritage Month. Kung fu and martial arts master teacher, David Leong, visited Tyee and taught students how to do a traditional lion dance. Dr. Aramaki was happy to see the students so engaged in the cultural activity! The students learned so much and had a lot of fun! &lt;br&gt;
&lt;br&gt;
#WeAreBellevue #AANHPIHeritageMonth #AAPIHeritageMonth" data-video="" data-carousel="{&quot;data&quot;:[{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/350615789_1379920095950467_7294868341909053358_n.jpg?_nc_cat=111&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=m_-AO2wmEnoAX-Y-kWP&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfApN5TYDsXWj3vBwt49iYM07TV5EcAfCrHPa3OGtsUD6A&amp;oe=648C4BEB&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/350635440_270163298802243_499934409316638372_n.jpg?_nc_cat=107&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=AqL7lHj3lJsAX8lCmSg&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfC8nphjtScxZOgig9-CZX8_vQNb_tMPX7urkKtO2BpXlg&amp;oe=648BC935&quot;}],&quot;vid_first&quot;:false}" data-id="sbi_18005840323697968" data-user="bellevueschools405" data-url="https://www.instagram.com/p/Cs7wgdzuruN/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/Cs7wgdzuruN/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-1.cdninstagram.com/v/t51.2885-15/350615789_1379920095950467_7294868341909053358_n.jpg?_nc_cat=111&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=m_-AO2wmEnoAX-Y-kWP&#038;_nc_ht=scontent-ord5-1.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfApN5TYDsXWj3vBwt49iYM07TV5EcAfCrHPa3OGtsUD6A&#038;oe=648C4BEB" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/350615789_1379920095950467_7294868341909053358_n.jpg?_nc_cat=111&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=m_-AO2wmEnoAX-Y-kWP&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfApN5TYDsXWj3vBwt49iYM07TV5EcAfCrHPa3OGtsUD6A&amp;oe=648C4BEB&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/350615789_1379920095950467_7294868341909053358_n.jpg?_nc_cat=111&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=m_-AO2wmEnoAX-Y-kWP&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfApN5TYDsXWj3vBwt49iYM07TV5EcAfCrHPa3OGtsUD6A&amp;oe=648C4BEB&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/350615789_1379920095950467_7294868341909053358_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/350615789_1379920095950467_7294868341909053358_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="Dr. Kelly Aramaki, BSD&#039;s incoming superintendent, joined students and staff at Tyee Middle School to celebrate Asian American, Native Hawaiian, yand Pacific Islander Heritage Month. Kung fu and martial arts master teacher, David Leong, visited Tyee and taught students how to do a traditional lion dance. Dr. Aramaki was happy to see the students so engaged in the cultural activity! The students learned so much and had a lot of fun! 

#WeAreBellevue #AANHPIHeritageMonth #AAPIHeritageMonth">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                72</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                0</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_video sbi_new sbi_transition" id="sbi_18076906681368978" data-date="1685565212" data-numcomments="0"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    		    <svg style="color: rgba(255,255,255,1)" class="svg-inline--fa fa-play fa-w-14 sbi_playbtn" aria-label="Play" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="play" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path></svg>
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">From @bellevuehsorchestra: preview of our upcoming concert!!<br><br>Thursday, June 8 at 7 p.m. at the Bellevue High School Performing Arts Center. 🎵</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/reel/Cs67PwkuMHa/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        May 31</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        42</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        0</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-1.cdninstagram.com/v/t51.36329-15/350466334_2512639222216850_9041146532469883297_n.jpg?_nc_cat=108&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=wyHjrWToY5wAX888CxC&#038;_nc_ht=scontent-ord5-1.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfAzypaflKfU7t9PFHVoJEvrsnQIHQA65nJGBc7QPPcMKQ&#038;oe=648B7B71" rel="nofollow noopener" data-lightbox-sbi="" data-title="From @bellevuehsorchestra: preview of our upcoming concert!!&lt;br&gt;
&lt;br&gt;
Thursday, June 8 at 7 p.m. at the Bellevue High School Performing Arts Center. 🎵" data-video="https://scontent-ord5-2.cdninstagram.com/o1/v/t16/f1/m82/F747E051076ED084D140A6139A3FA696_video_dashinit.mp4?efg=eyJ2ZW5jb2RlX3RhZyI6InZ0c192b2RfdXJsZ2VuLjg4OC5jbGlwcyJ9&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;_nc_cat=105&amp;vs=1983836455287649_820750055&amp;_nc_vs=HBksFQIYT2lnX3hwdl9yZWVsc19wZXJtYW5lbnRfcHJvZC9GNzQ3RTA1MTA3NkVEMDg0RDE0MEE2MTM5QTNGQTY5Nl92aWRlb19kYXNoaW5pdC5tcDQVAALIAQAVABgkR0dJbTZ4U1J1SXRtb3ZJQUFFWWlKam43dHhZTWJxX0VBQUFGFQICyAEAKAAYABsBiAd1c2Vfb2lsATEVAAAmjJa%2F5%2FnE5T8VAigCQzMsF0AvmZmZmZmaGBJkYXNoX2Jhc2VsaW5lXzFfdjERAHUAAA%3D%3D&amp;ccb=9-4&amp;oh=00_AfBcYPAG_H-HGqQl_xCQ49xvwV3yq4tuJ_Ix5zbr9TS8Qw&amp;oe=6488A277&amp;_nc_sid=c07a80&amp;_nc_rid=be8a0be348" data-carousel="" data-id="sbi_18076906681368978" data-user="bellevueschools405" data-url="https://www.instagram.com/reel/Cs67PwkuMHa/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="reels" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				    <svg style="color: rgba(255,255,255,1)" class="svg-inline--fa fa-play fa-w-14 sbi_playbtn" aria-label="Play" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="play" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path></svg>                </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/reel/Cs67PwkuMHa/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-1.cdninstagram.com/v/t51.36329-15/350466334_2512639222216850_9041146532469883297_n.jpg?_nc_cat=108&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=wyHjrWToY5wAX888CxC&#038;_nc_ht=scontent-ord5-1.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfAzypaflKfU7t9PFHVoJEvrsnQIHQA65nJGBc7QPPcMKQ&#038;oe=648B7B71" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.36329-15\/350466334_2512639222216850_9041146532469883297_n.jpg?_nc_cat=108&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=wyHjrWToY5wAX888CxC&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfAzypaflKfU7t9PFHVoJEvrsnQIHQA65nJGBc7QPPcMKQ&amp;oe=648B7B71&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.36329-15\/350466334_2512639222216850_9041146532469883297_n.jpg?_nc_cat=108&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=wyHjrWToY5wAX888CxC&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfAzypaflKfU7t9PFHVoJEvrsnQIHQA65nJGBc7QPPcMKQ&amp;oe=648B7B71&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/350466334_2512639222216850_9041146532469883297_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/350466334_2512639222216850_9041146532469883297_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="From @bellevuehsorchestra: preview of our upcoming concert!!

Thursday, June 8 at 7 p.m. at the Bellevue High School Performing Arts Center. 🎵">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                42</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                0</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_carousel sbi_new sbi_transition" id="sbi_18292769203106127" data-date="1685556978" data-numcomments="1"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    <svg class="svg-inline--fa fa-clone fa-w-16 sbi_lightbox_carousel_icon" aria-hidden="true" aria-label="Clone" data-fa-proƒcessed="" data-prefix="far" data-icon="clone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	                <path fill="currentColor" d="M464 0H144c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h320c26.51 0 48-21.49 48-48v-48h48c26.51 0 48-21.49 48-48V48c0-26.51-21.49-48-48-48zM362 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h42v224c0 26.51 21.49 48 48 48h224v42a6 6 0 0 1-6 6zm96-96H150a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h308a6 6 0 0 1 6 6v308a6 6 0 0 1-6 6z"></path>
	            </svg>		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">Zoologist and educator Scott Petersen, also known as the Reptile Man, visited Newport Heights Elementary with his scaly friends on May 25! Students, staff and families had so much fun making new friends with the reptiles, including an alligator and an albino python! They also learned about the importance of all animals in nature. 🦎🐍💚 <br><br>Scott Petersen owns The Reptile Zoo in Monroe, Washington, which is home to the most extensive collection of reptiles on display in the Pacific Northwest! <br><br>Special thank you to the @NewportHeightsElementaryPTA for holding this awesome assembly! <br><br>#NHEDolphins #TheReptileMan #WeAreBellevue</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/Cs6tB2FOdvt/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        May 31</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        62</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        1</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-2.cdninstagram.com/v/t51.2885-15/350463400_208853872108692_4081807611012442065_n.jpg?_nc_cat=110&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=PxlkOtJgzScAX-LUsDK&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBok0hJE-uBOpxibzbL8BLNmXI1oWXuxG99KK6hqEe1Rg&#038;oe=648C930D" rel="nofollow noopener" data-lightbox-sbi="" data-title="Zoologist and educator Scott Petersen, also known as the Reptile Man, visited Newport Heights Elementary with his scaly friends on May 25! Students, staff and families had so much fun making new friends with the reptiles, including an alligator and an albino python! They also learned about the importance of all animals in nature. 🦎🐍💚 &lt;br&gt;
&lt;br&gt;
Scott Petersen owns The Reptile Zoo in Monroe, Washington, which is home to the most extensive collection of reptiles on display in the Pacific Northwest! &lt;br&gt;
&lt;br&gt;
Special thank you to the @NewportHeightsElementaryPTA for holding this awesome assembly! &lt;br&gt;
&lt;br&gt;
#NHEDolphins #TheReptileMan #WeAreBellevue" data-video="" data-carousel="{&quot;data&quot;:[{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/350463400_208853872108692_4081807611012442065_n.jpg?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=PxlkOtJgzScAX-LUsDK&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBok0hJE-uBOpxibzbL8BLNmXI1oWXuxG99KK6hqEe1Rg&amp;oe=648C930D&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/350576607_161082566782385_6422134440180270960_n.jpg?_nc_cat=101&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=sfEPhXfoHE4AX-9wDjy&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBA7JImIBaeZ23x2-WFk3Ikl-Tkzzh0Rf5NnrYyOGio0A&amp;oe=648C8DDA&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/350336587_146279798443015_2631730593159668841_n.jpg?_nc_cat=109&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=XyKsxEssk5AAX9GTNdd&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfDIHsznuNXn-6hGIhPY_kyEDn5rkOo92l3FXgLQlgYe8Q&amp;oe=648CB4E2&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/350083927_995640344931865_38028196241037245_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=uWCSdMRlUQEAX_hYYIo&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfCZZMa6_T7B63BQotfw-C0WtOxmr-cT0io86EKzj2423w&amp;oe=648C791D&quot;}],&quot;vid_first&quot;:false}" data-id="sbi_18292769203106127" data-user="bellevueschools405" data-url="https://www.instagram.com/p/Cs6tB2FOdvt/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/Cs6tB2FOdvt/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-2.cdninstagram.com/v/t51.2885-15/350463400_208853872108692_4081807611012442065_n.jpg?_nc_cat=110&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=PxlkOtJgzScAX-LUsDK&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBok0hJE-uBOpxibzbL8BLNmXI1oWXuxG99KK6hqEe1Rg&#038;oe=648C930D" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/350463400_208853872108692_4081807611012442065_n.jpg?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=PxlkOtJgzScAX-LUsDK&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBok0hJE-uBOpxibzbL8BLNmXI1oWXuxG99KK6hqEe1Rg&amp;oe=648C930D&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.2885-15\/350463400_208853872108692_4081807611012442065_n.jpg?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=PxlkOtJgzScAX-LUsDK&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBok0hJE-uBOpxibzbL8BLNmXI1oWXuxG99KK6hqEe1Rg&amp;oe=648C930D&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/350463400_208853872108692_4081807611012442065_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/350463400_208853872108692_4081807611012442065_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="Zoologist and educator Scott Petersen, also known as the Reptile Man, visited Newport Heights Elementary with his scaly friends on May 25! Students, staff and families had so much fun making new friends with the reptiles, including an alligator and an albino python! They also learned about the importance of all animals in nature. 🦎🐍💚 

Scott Petersen owns The Reptile Zoo in Monroe, Washington, which is home to the most extensive collection of reptiles on display in the Pacific Northwest! 

Special thank you to the @NewportHeightsElementaryPTA for holding this awesome assembly! 

#NHEDolphins #TheReptileMan #WeAreBellevue">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                62</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                1</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_carousel sbi_new sbi_transition" id="sbi_17864204435900806" data-date="1685556913" data-numcomments="1"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    <svg class="svg-inline--fa fa-clone fa-w-16 sbi_lightbox_carousel_icon" aria-hidden="true" aria-label="Clone" data-fa-proƒcessed="" data-prefix="far" data-icon="clone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	                <path fill="currentColor" d="M464 0H144c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h320c26.51 0 48-21.49 48-48v-48h48c26.51 0 48-21.49 48-48V48c0-26.51-21.49-48-48-48zM362 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h42v224c0 26.51 21.49 48 48 48h224v42a6 6 0 0 1-6 6zm96-96H150a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h308a6 6 0 0 1 6 6v308a6 6 0 0 1-6 6z"></path>
	            </svg>		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">The votes are in! Rebecca Wu, a 6th grader from International School, is one of the five National Finalists for the 2023 Doodle for Google Contest! Congratulations, Rebecca! 🎨🎉 <br><br>Google reviewed tens of thousands of artwork submissions, selected 55 state and territory winners, and asked the public to vote for their favorite Doodles. The National Winner will take home a $30,000 college scholarship, and their school will receive a $50,000 tech package toward the establishment or improvement of a computer lab or technology program. Google will announce the National Winner on June 6.<br><br>For this year’s prompt, Google asked students across the United States to illustrate their answers to their prompt, “I am grateful for…”<br><br>The submissions are evaluated on how well they addressed the prompt through both their artwork and written statement, plus overall artistic merit and creativity.<br><br>Here is Rebecca`s written statement that accompanies her Doodle: <br><br>My Sweetest Memories<br><br>Sometimes I love them, and sometimes I dislike them very much, but I can`t imagine my life without my sisters. I have learned to be a little bit more patient with them, and they have had an enormous impact on me. We help to inspire each other and to help each other grow like the vines and flowers in my picture. I am never lonely with them, and they can cheer me up. I am grateful for them and all that they have done for me. In this drawing, we are having a fun time drinking hot chocolate, which is one of my fondest memories. The rainbow in the background symbolizes one of the first things I helped one of my sisters draw. In one of my family pictures, my sisters (sitting next to me) and I (the one in the middle) are sitting in flowers with a background that I drew, so I thought it would be fun to reference that by drawing us sitting flowers here. The word &quot;Google&quot; is related with the stems of flowers and vines, also following the flower/garden theme. My drawing is composed of all our happiest memories to show just how grateful I am for them.<br><br>View the stories of gratitude from the five National Finalists: https://bit.ly/3qo2M7W<br><br>#WeAreBellevue #DoodleForGoogle #StudentArt #artgallery</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/Cs6s5-lO1BW/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        May 31</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        99</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        1</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-1.cdninstagram.com/v/t51.2885-15/350306327_931349058124681_3370217879836406974_n.jpg?_nc_cat=101&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=Iwflb1LOHYAAX8C5oYi&#038;_nc_ht=scontent-ord5-1.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBTTfn4sOYMCRub3qbrlwxzQe3jd7m7yQCU-sTHyhAmwQ&#038;oe=648C0D42" rel="nofollow noopener" data-lightbox-sbi="" data-title="The votes are in! Rebecca Wu, a 6th grader from International School, is one of the five National Finalists for the 2023 Doodle for Google Contest! Congratulations, Rebecca! 🎨🎉 &lt;br&gt;
&lt;br&gt;
Google reviewed tens of thousands of artwork submissions, selected 55 state and territory winners, and asked the public to vote for their favorite Doodles. The National Winner will take home a $30,000 college scholarship, and their school will receive a $50,000 tech package toward the establishment or improvement of a computer lab or technology program. Google will announce the National Winner on June 6.&lt;br&gt;
&lt;br&gt;
For this year’s prompt, Google asked students across the United States to illustrate their answers to their prompt, “I am grateful for…”&lt;br&gt;
&lt;br&gt;
The submissions are evaluated on how well they addressed the prompt through both their artwork and written statement, plus overall artistic merit and creativity.&lt;br&gt;
&lt;br&gt;
Here is Rebecca&#039;s written statement that accompanies her Doodle: &lt;br&gt;
&lt;br&gt;
My Sweetest Memories&lt;br&gt;
&lt;br&gt;
Sometimes I love them, and sometimes I dislike them very much, but I can&#039;t imagine my life without my sisters. I have learned to be a little bit more patient with them, and they have had an enormous impact on me. We help to inspire each other and to help each other grow like the vines and flowers in my picture. I am never lonely with them, and they can cheer me up. I am grateful for them and all that they have done for me. In this drawing, we are having a fun time drinking hot chocolate, which is one of my fondest memories. The rainbow in the background symbolizes one of the first things I helped one of my sisters draw. In one of my family pictures, my sisters (sitting next to me) and I (the one in the middle) are sitting in flowers with a background that I drew, so I thought it would be fun to reference that by drawing us sitting flowers here. The word &quot;Google&quot; is related with the stems of flowers and vines, also following the flower/garden theme. My drawing is composed of all our happiest memories to show just how grateful I am for them.&lt;br&gt;
&lt;br&gt;
View the stories of gratitude from the five National Finalists: https://bit.ly/3qo2M7W&lt;br&gt;
&lt;br&gt;
#WeAreBellevue #DoodleForGoogle #StudentArt #artgallery" data-video="" data-carousel="{&quot;data&quot;:[{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/350306327_931349058124681_3370217879836406974_n.jpg?_nc_cat=101&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=Iwflb1LOHYAAX8C5oYi&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBTTfn4sOYMCRub3qbrlwxzQe3jd7m7yQCU-sTHyhAmwQ&amp;oe=648C0D42&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/350440452_202257519375221_2853318442497662286_n.jpg?_nc_cat=101&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=6S1BkVkz7XcAX-eSwAH&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBa9ovTVNayY8b9T2m7I7-Via7o0a4KWuxzH7UW6riCNg&amp;oe=648C81DC&quot;}],&quot;vid_first&quot;:false}" data-id="sbi_17864204435900806" data-user="bellevueschools405" data-url="https://www.instagram.com/p/Cs6s5-lO1BW/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/Cs6s5-lO1BW/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-1.cdninstagram.com/v/t51.2885-15/350306327_931349058124681_3370217879836406974_n.jpg?_nc_cat=101&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=Iwflb1LOHYAAX8C5oYi&#038;_nc_ht=scontent-ord5-1.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBTTfn4sOYMCRub3qbrlwxzQe3jd7m7yQCU-sTHyhAmwQ&#038;oe=648C0D42" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/350306327_931349058124681_3370217879836406974_n.jpg?_nc_cat=101&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=Iwflb1LOHYAAX8C5oYi&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBTTfn4sOYMCRub3qbrlwxzQe3jd7m7yQCU-sTHyhAmwQ&amp;oe=648C0D42&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.2885-15\/350306327_931349058124681_3370217879836406974_n.jpg?_nc_cat=101&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=Iwflb1LOHYAAX8C5oYi&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBTTfn4sOYMCRub3qbrlwxzQe3jd7m7yQCU-sTHyhAmwQ&amp;oe=648C0D42&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/350306327_931349058124681_3370217879836406974_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/350306327_931349058124681_3370217879836406974_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="The votes are in! Rebecca Wu, a 6th grader from International School, is one of the five National Finalists for the 2023 Doodle for Google Contest! Congratulations, Rebecca! 🎨🎉 

Google reviewed tens of thousands of artwork submissions, selected 55 state and territory winners, and asked the public to vote for their favorite Doodles. The National Winner will take home a $30,000 college scholarship, and their school will receive a $50,000 tech package toward the establishment or improvement of a computer lab or technology program. Google will announce the National Winner on June 6.

For this year’s prompt, Google asked students across the United States to illustrate their answers to their prompt, “I am grateful for…”

The submissions are evaluated on how well they addressed the prompt through both their artwork and written statement, plus overall artistic merit and creativity.

Here is Rebecca&#039;s written statement that accompanies her Doodle: 

My Sweetest Memories

Sometimes I love them, and sometimes I dislike them very much, but I can&#039;t imagine my life without my sisters. I have learned to be a little bit more patient with them, and they have had an enormous impact on me. We help to inspire each other and to help each other grow like the vines and flowers in my picture. I am never lonely with them, and they can cheer me up. I am grateful for them and all that they have done for me. In this drawing, we are having a fun time drinking hot chocolate, which is one of my fondest memories. The rainbow in the background symbolizes one of the first things I helped one of my sisters draw. In one of my family pictures, my sisters (sitting next to me) and I (the one in the middle) are sitting in flowers with a background that I drew, so I thought it would be fun to reference that by drawing us sitting flowers here. The word &quot;Google&quot; is related with the stems of flowers and vines, also following the flower/garden theme. My drawing is composed of all our happiest memories to show just how grateful I am for them.

View the stories of gratitude from the five National Finalists: https://bit.ly/3qo2M7W

#WeAreBellevue #DoodleForGoogle #StudentArt #artgallery">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                99</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                1</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div><div class="sbi_item sbi_type_carousel sbi_new sbi_transition" id="sbi_18075772750337192" data-date="1685068831" data-numcomments="1"  >
    <div class="sbi_inner_wrap" style="background-color: #FFFFFF;  border-radius: 4px; ">
        <div class="sbi_photo_wrap" >
		    		    <svg class="svg-inline--fa fa-clone fa-w-16 sbi_lightbox_carousel_icon" aria-hidden="true" aria-label="Clone" data-fa-proƒcessed="" data-prefix="far" data-icon="clone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
	                <path fill="currentColor" d="M464 0H144c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h320c26.51 0 48-21.49 48-48v-48h48c26.51 0 48-21.49 48-48V48c0-26.51-21.49-48-48-48zM362 464H54a6 6 0 0 1-6-6V150a6 6 0 0 1 6-6h42v224c0 26.51 21.49 48 48 48h224v42a6 6 0 0 1-6 6zm96-96H150a6 6 0 0 1-6-6V54a6 6 0 0 1 6-6h308a6 6 0 0 1 6 6v308a6 6 0 0 1-6 6z"></path>
	            </svg>		    
            <div  style="background: rgba(0,0,0,0.85)"  class="sbi_link " >
                <div class="sbi_hover_top">
				    				                            <p class="sbi_hover_caption_wrap" >
                            <span class="sbi_caption">Angela Zhang, an eighth grader at Bellevue Digital Discovery, is being hailed as golf`s newest prodigy! 🥳<br> <br>Last summer, at 13, Angela became the youngest winner of the Washington Women’s Amateur, which is open to all ages. And next month she`s headed to Pebble Beach to play in the U.S. Women’s Open! 🤩<br> <br>Born in Alabama, Angela moved to China with her family, where her father Kevin Zhang and mother Binbin Hu are from. When Angela was 5, her family moved to Bellevue, and she started playing golf to spend time with her father, an avid golfer, and older brother Eric, who also played.<br> <br>Angela went undefeated in seven state events last year with an average score of 70.79, and won four national junior events. Her ultimate goal is to be the number one female player in the world! 🔥<br> <br>We`ll be cheering for Angela as she competes with the greatest players in the world at the U.S. Women’s Open, July 6-9! ⛳👏<br> <br>Read more about Angela`s inspiring story in the @seattletimes:<br>https://bit.ly/3OzeWVR<br> <br>#WeAreBellevue</span>
                        </p>
				                    </div>
			                        <a class="sbi_instagram_link" href="https://www.instagram.com/p/CssJ-GVrp3w/" target="_blank" rel="nofollow noopener" title="Instagram" >
                        <span class="sbi-screenreader">View</span>
					    <svg class="svg-inline--fa fa-instagram fa-w-14" aria-hidden="true" data-fa-processed="" aria-label="Instagram" data-prefix="fab" data-icon="instagram" role="img" viewBox="0 0 448 512">
	                <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
	            </svg>                    </a>
			                    <div class="sbi_hover_bottom" >
				                            <p>
						                                    <span class="sbi_date">
                        <svg  class="svg-inline--fa fa-clock fa-w-16" aria-hidden="true" data-fa-processed="" data-prefix="far" data-icon="clock" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg>                        May 26</span>
						    
						                            </p>
				    				                            <div class="sbi_meta">
                    <span class="sbi_likes" >
                        <svg  class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                        144</span>
                            <span class="sbi_comments" >
                        <svg  class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                        1</span>
                        </div>
				                    </div>
                <a class="sbi_link_area nofancybox" href="https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/348864237_1518520285223175_4694362552276768706_n.jpg?_nc_cat=110&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=IHiCLREymlMAX-cPtU-&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBeukO1rAtJpdf3zn05YzTivmNx8YaYTE5TlTKjscq5gg&#038;oe=648BC015" rel="nofollow noopener" data-lightbox-sbi="" data-title="Angela Zhang, an eighth grader at Bellevue Digital Discovery, is being hailed as golf&#039;s newest prodigy! 🥳&lt;br&gt;
 &lt;br&gt;
Last summer, at 13, Angela became the youngest winner of the Washington Women’s Amateur, which is open to all ages. And next month she&#039;s headed to Pebble Beach to play in the U.S. Women’s Open! 🤩&lt;br&gt;
 &lt;br&gt;
Born in Alabama, Angela moved to China with her family, where her father Kevin Zhang and mother Binbin Hu are from. When Angela was 5, her family moved to Bellevue, and she started playing golf to spend time with her father, an avid golfer, and older brother Eric, who also played.&lt;br&gt;
 &lt;br&gt;
Angela went undefeated in seven state events last year with an average score of 70.79, and won four national junior events. Her ultimate goal is to be the number one female player in the world! 🔥&lt;br&gt;
 &lt;br&gt;
We&#039;ll be cheering for Angela as she competes with the greatest players in the world at the U.S. Women’s Open, July 6-9! ⛳👏&lt;br&gt;
 &lt;br&gt;
Read more about Angela&#039;s inspiring story in the @seattletimes:&lt;br&gt;
https://bit.ly/3OzeWVR&lt;br&gt;
 &lt;br&gt;
#WeAreBellevue" data-video="" data-carousel="{&quot;data&quot;:[{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/348864237_1518520285223175_4694362552276768706_n.jpg?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=IHiCLREymlMAX-cPtU-&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBeukO1rAtJpdf3zn05YzTivmNx8YaYTE5TlTKjscq5gg&amp;oe=648BC015&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-1.cdninstagram.com\/v\/t51.29350-15\/348856275_1516754055519945_8833756973177072336_n.jpg?_nc_cat=108&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=7WrHv5eKxKAAX--2j0A&amp;_nc_ht=scontent-ord5-1.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfA0CcnILtN1Y2RGwD1Vym0xmAV5vVNhW1CFppJb_DuPig&amp;oe=648C10F8&quot;},{&quot;type&quot;:&quot;image&quot;,&quot;media&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/348833911_983831802616966_3029654919795842315_n.jpg?_nc_cat=107&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=N29nEIX8pLEAX-j8-sW&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfAAhlbqx7AYq7QtZ2KRXg4W5yDNRV-o1gf4K9-3na4t2Q&amp;oe=648AE8B7&quot;}],&quot;vid_first&quot;:false}" data-id="sbi_18075772750337192" data-user="bellevueschools405" data-url="https://www.instagram.com/p/CssJ-GVrp3w/" data-avatar="https://scontent-ord5-2.xx.fbcdn.net/v/t51.2885-15/67493680_388857235161708_8134944001682833408_n.jpg?_nc_cat=103&amp;ccb=1-7&amp;_nc_sid=86c713&amp;_nc_ohc=O2Qw3aKWX_sAX_cxM3F&amp;_nc_ht=scontent-ord5-2.xx&amp;edm=AL-3X8kEAAAA&amp;oh=00_AfBk_ZZftu5dPF0fUSVWrgYW837dFbbvBPc9cNmIzBz2dQ&amp;oe=63FDF7B5" data-account-type="business" data-iframe='' data-media-type="feed" data-posted-on="">
                    <span class="sbi-screenreader">Open</span>
				                    </a>
            </div>

            <a class="sbi_photo" href="https://www.instagram.com/p/CssJ-GVrp3w/" target="_blank" rel="nofollow noopener" data-full-res="https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/348864237_1518520285223175_4694362552276768706_n.jpg?_nc_cat=110&#038;ccb=1-7&#038;_nc_sid=8ae9d6&#038;_nc_ohc=IHiCLREymlMAX-cPtU-&#038;_nc_ht=scontent-ord5-2.cdninstagram.com&#038;edm=AM6HXa8EAAAA&#038;oh=00_AfBeukO1rAtJpdf3zn05YzTivmNx8YaYTE5TlTKjscq5gg&#038;oe=648BC015" data-img-src-set="{&quot;d&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/348864237_1518520285223175_4694362552276768706_n.jpg?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=IHiCLREymlMAX-cPtU-&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBeukO1rAtJpdf3zn05YzTivmNx8YaYTE5TlTKjscq5gg&amp;oe=648BC015&quot;,&quot;150&quot;:&quot;https:\/\/scontent-ord5-2.cdninstagram.com\/v\/t51.29350-15\/348864237_1518520285223175_4694362552276768706_n.jpg?_nc_cat=110&amp;ccb=1-7&amp;_nc_sid=8ae9d6&amp;_nc_ohc=IHiCLREymlMAX-cPtU-&amp;_nc_ht=scontent-ord5-2.cdninstagram.com&amp;edm=AM6HXa8EAAAA&amp;oh=00_AfBeukO1rAtJpdf3zn05YzTivmNx8YaYTE5TlTKjscq5gg&amp;oe=648BC015&quot;,&quot;320&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/348864237_1518520285223175_4694362552276768706_nlow.jpg&quot;,&quot;640&quot;:&quot;https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/348864237_1518520285223175_4694362552276768706_nfull.jpg&quot;}">
                <img src="https://bsd405.org/wp-content/plugins/instagram-feed-pro/img/placeholder.png" alt="Angela Zhang, an eighth grader at Bellevue Digital Discovery, is being hailed as golf&#039;s newest prodigy! 🥳
 
Last summer, at 13, Angela became the youngest winner of the Washington Women’s Amateur, which is open to all ages. And next month she&#039;s headed to Pebble Beach to play in the U.S. Women’s Open! 🤩
 
Born in Alabama, Angela moved to China with her family, where her father Kevin Zhang and mother Binbin Hu are from. When Angela was 5, her family moved to Bellevue, and she started playing golf to spend time with her father, an avid golfer, and older brother Eric, who also played.
 
Angela went undefeated in seven state events last year with an average score of 70.79, and won four national junior events. Her ultimate goal is to be the number one female player in the world! 🔥
 
We&#039;ll be cheering for Angela as she competes with the greatest players in the world at the U.S. Women’s Open, July 6-9! ⛳👏
 
Read more about Angela&#039;s inspiring story in the @seattletimes:
https://bit.ly/3OzeWVR
 
#WeAreBellevue">
            </a>
        </div>

        <div class="sbi_info_wrapper">
            <div class="sbi_info">

		        
		                            <div class="sbi_meta"  style="color: rgb(209,78,82);">
            <span class="sbi_likes"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-heart fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="heart" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M414.9 24C361.8 24 312 65.7 288 89.3 264 65.7 214.2 24 161.1 24 70.3 24 16 76.9 16 165.5c0 72.6 66.8 133.3 69.2 135.4l187 180.8c8.8 8.5 22.8 8.5 31.6 0l186.7-180.2c2.7-2.7 69.5-63.5 69.5-136C560 76.9 505.7 24 414.9 24z"></path></svg>                144</span>
                        <span class="sbi_comments"  style="font-size: 13px;color: rgb(209,78,82);">
                <svg  style="font-size: 13px;color: rgb(209,78,82);" class="svg-inline--fa fa-comment fa-w-18" aria-hidden="true" data-fa-processed="" data-prefix="fa" data-icon="comment" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M576 240c0 115-129 208-288 208-48.3 0-93.9-8.6-133.9-23.8-40.3 31.2-89.8 50.3-142.4 55.7-5.2.6-10.2-2.8-11.5-7.7-1.3-5 2.7-8.1 6.6-11.8 19.3-18.4 42.7-32.8 51.9-94.6C21.9 330.9 0 287.3 0 240 0 125.1 129 32 288 32s288 93.1 288 208z"></path></svg>                1</span>
                    </div>
		        
            </div>
        </div>
    </div>

</div>    </div>

	<div id="sbi_load" >

	        <a class="sbi_load_btn" href="javascript:void(0);" style="background: rgb(243,244,245);color: rgb(44,50,76);" data-button-hover="#E8E8EB">
            <span class="sbi_btn_text">Load More</span>
            <span class="sbi_loader sbi_hidden" style="background-color: rgb(255, 255, 255);" aria-hidden="true"></span>
        </a>
	
	
</div>
	    <span class="sbi_resized_image_data" data-feed-id="*2" data-resized="{&quot;18075772750337192&quot;:{&quot;id&quot;:&quot;348864237_1518520285223175_4694362552276768706_n&quot;,&quot;ratio&quot;:&quot;1.07&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;18076906681368978&quot;:{&quot;id&quot;:&quot;350466334_2512639222216850_9041146532469883297_n&quot;,&quot;ratio&quot;:&quot;1.81&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;18292769203106127&quot;:{&quot;id&quot;:&quot;350463400_208853872108692_4081807611012442065_n&quot;,&quot;ratio&quot;:&quot;0.80&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;17864204435900806&quot;:{&quot;id&quot;:&quot;350306327_931349058124681_3370217879836406974_n&quot;,&quot;ratio&quot;:&quot;1.91&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;18005840323697968&quot;:{&quot;id&quot;:&quot;350615789_1379920095950467_7294868341909053358_n&quot;,&quot;ratio&quot;:&quot;1.19&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;17938351067663416&quot;:{&quot;id&quot;:&quot;350511261_560863259573515_8975321567468387680_n&quot;,&quot;ratio&quot;:&quot;1.74&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;17966722430303219&quot;:{&quot;id&quot;:&quot;350846306_1048037782825954_895748716231647280_n&quot;,&quot;ratio&quot;:&quot;1.34&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;18019125253578607&quot;:{&quot;id&quot;:&quot;351278286_1703259016774296_7940746603542312036_n&quot;,&quot;ratio&quot;:&quot;1.01&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;18033581572496909&quot;:{&quot;id&quot;:&quot;350727301_1331702644077346_706045633063365430_n&quot;,&quot;ratio&quot;:&quot;0.84&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;17988201178910982&quot;:{&quot;id&quot;:&quot;352275375_1993165761031840_9171230216684949170_n&quot;,&quot;ratio&quot;:&quot;1.02&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;17984184047153619&quot;:{&quot;id&quot;:&quot;351441965_669199031887547_5971191712398592315_n&quot;,&quot;ratio&quot;:&quot;1.54&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;17986385843104513&quot;:{&quot;id&quot;:&quot;352236327_552979756813997_2572564983005849532_n&quot;,&quot;ratio&quot;:&quot;1.83&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;18026558206533542&quot;:{&quot;id&quot;:&quot;352183455_260631953223499_438263018744322651_n&quot;,&quot;ratio&quot;:&quot;1.47&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;17958475751604113&quot;:{&quot;id&quot;:&quot;352258046_1021336072186155_2520228910560834382_n&quot;,&quot;ratio&quot;:&quot;1.47&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;18005214433762562&quot;:{&quot;id&quot;:&quot;352127905_1655500608226785_1023903372736001283_n&quot;,&quot;ratio&quot;:&quot;1.01&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;18296683450108156&quot;:{&quot;id&quot;:&quot;351852665_815723426568702_2336624768425015845_n&quot;,&quot;ratio&quot;:&quot;0.99&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;18033722041497717&quot;:{&quot;id&quot;:&quot;352831392_935819867471582_1410113257581679336_n&quot;,&quot;ratio&quot;:&quot;1.49&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;17961589652530163&quot;:{&quot;id&quot;:&quot;352348515_179164598457671_264043068781058717_n&quot;,&quot;ratio&quot;:&quot;1.33&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;17924933411707703&quot;:{&quot;id&quot;:&quot;352849222_803876517662126_8230002137246554684_n&quot;,&quot;ratio&quot;:&quot;1.33&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}},&quot;17971309847232792&quot;:{&quot;id&quot;:&quot;353631200_6562884090422920_4153509776370375683_n&quot;,&quot;ratio&quot;:&quot;1.36&quot;,&quot;sizes&quot;:{&quot;full&quot;:640,&quot;low&quot;:320,&quot;thumb&quot;:150}}}">
	</span>
	
</div>

	<style type="text/css">
				#sb_instagram #sbi_load .sbi_load_btn:hover{
			outline: none;
			box-shadow: inset 0 0 20px 20px #E8E8EB;
		}
				
		#sb_instagram .sbi_follow_btn a:hover,
		#sb_instagram .sbi_follow_btn a:focus{
			outline: none;
			box-shadow: inset 0 0 10px 20px #005B8C;
		}
			</style>
	</p>
</div></div></div></div></div></section><section class="cs-section custom-padding" style=" padding-top: 0px; padding-bottom:0px;"><div class="container"><div class="row"><div class="col-md-12" style="padding-left: 12px; padding-right:12px;"><div class="cs-column-inner"><a href="https://bsd405.org/about/creators-of-their-future-world/" class="cs-btn cs-btn-custom cs-btn-square cs-btn-custom-own cs-btn-lg cs-btn-custom-648778441ff98 button-resources">Creators of Their Future World</a><a href="https://bsd405.org/services/health/covid-19-health-and-safety/" class="cs-btn cs-btn-custom cs-btn-square cs-btn-custom-own cs-btn-lg cs-btn-custom-648778441ffab button-resources">COVID-19 Health and Safety</a><a href="https://bsd405.org/schools/choice/online-school/" class="cs-btn cs-btn-custom cs-btn-square cs-btn-custom-own cs-btn-lg cs-btn-custom-648778441ffb8 button-resources">Bellevue Digital Discovery</a><a href="https://bsd405.org/services/mental-health-services/" class="cs-btn cs-btn-custom cs-btn-square cs-btn-custom-own cs-btn-lg cs-btn-custom-648778441ffc3 button-resources">Mental Health</a><a href="https://bsd405.org/2021/05/recovery-plan-2021-22-school-year/" class="cs-btn cs-btn-custom cs-btn-square cs-btn-custom-own cs-btn-lg cs-btn-custom-648778441ffcf button-resources">2022-23 Annual and Recovery Plans</a><a href="https://bsd405.org/departments/finance/budget/" class="cs-btn cs-btn-custom cs-btn-square cs-btn-custom-own cs-btn-lg cs-btn-custom-648778441ffd9 button-resources">District Budget Information</a></div></div></div></div></section><section class="cs-section custom-padding" style=" padding-top: 30px; padding-bottom:30px;"><div class="container"><div class="row"><div class="col-md-12"><div class="cs-column-inner"><div class="cs-column-text"><p style="text-align: center;"><em>The Bellevue School District acknowledges that we learn, work, live and gather on the Indigenous Land of the Coast Salish peoples, specifically the Duwamish and Snoqualmie Tribes. We thank these caretakers of this land, who have lived and continue to live here, since time immemorial.</em></p>
</div></div></div></div></div></section><section class="cs-section custom-padding" style=" background-color: #f2f2f2; padding-top: 30px; padding-bottom:30px;"><div class="container"><div class="row"><div class="col-md-3"><div class="cs-column-inner"><div class="cs-divider-icon text-center"><div class="cs-divider-icon-inner cs-divider-icon-double"><span class="inner-text">Spotlight</span></div></div><a href="https://bsd405.org/2022/09/new-resources-from-the-office-of-education-ombuds/"><img width="1024" height="485" src="https://bsd405.org/wp-content/uploads/2022/09/ombus-banner-1024x485.png" class="attachment-large size-large" alt="" decoding="async" loading="lazy" srcset="https://bsd405.org/wp-content/uploads/2022/09/ombus-banner-1024x485.png 1024w, https://bsd405.org/wp-content/uploads/2022/09/ombus-banner-300x142.png 300w, https://bsd405.org/wp-content/uploads/2022/09/ombus-banner-768x364.png 768w, https://bsd405.org/wp-content/uploads/2022/09/ombus-banner.png 1140w" sizes="(max-width: 1024px) 100vw, 1024px" /></a><div class="cs-column-text bsd-card"><p style="text-align: center;"><a href="https://bsd405.org/2022/09/new-resources-from-the-office-of-education-ombuds/"><strong><span style="font-size: 17px;">Office of Education Ombuds (OEO)</span></strong></a></p>
</div><a href="https://bsd405.org/2022/08/new-bellevue-family-hub-opens-to-support-bsd-families/"><img width="1024" height="485" src="https://bsd405.org/wp-content/uploads/2022/08/family-hub-banner-1024x485.png" class="attachment-large size-large" alt="Bellevue Family Hub, Bellevue LifeSpring" decoding="async" loading="lazy" srcset="https://bsd405.org/wp-content/uploads/2022/08/family-hub-banner-1024x485.png 1024w, https://bsd405.org/wp-content/uploads/2022/08/family-hub-banner-300x142.png 300w, https://bsd405.org/wp-content/uploads/2022/08/family-hub-banner-768x364.png 768w, https://bsd405.org/wp-content/uploads/2022/08/family-hub-banner.png 1140w" sizes="(max-width: 1024px) 100vw, 1024px" /></a><div class="cs-column-text bsd-card"><p style="text-align: center;"><a href="https://bsd405.org/2022/08/new-bellevue-family-hub-opens-to-support-bsd-families/"><strong><span style="font-size: 17px;">Bellevue Family HUB</span></strong></a></p>
</div><a href="https://bsd405.org/our-commitment-to-equity/"><img width="1024" height="485" src="https://bsd405.org/wp-content/uploads/2019/03/culture-and-climate-light-orange-hex-1140x540-1024x485.png" class="attachment-large size-large" alt="Culture &amp; Climate" decoding="async" loading="lazy" srcset="https://bsd405.org/wp-content/uploads/2019/03/culture-and-climate-light-orange-hex-1140x540-1024x485.png 1024w, https://bsd405.org/wp-content/uploads/2019/03/culture-and-climate-light-orange-hex-1140x540-300x142.png 300w, https://bsd405.org/wp-content/uploads/2019/03/culture-and-climate-light-orange-hex-1140x540-768x364.png 768w, https://bsd405.org/wp-content/uploads/2019/03/culture-and-climate-light-orange-hex-1140x540.png 1140w" sizes="(max-width: 1024px) 100vw, 1024px" /></a><div class="cs-column-text bsd-card"><p style="text-align: center;"><a href="https://bsd405.org/our-commitment-to-equity/"><strong><span style="font-size: 17px;">Our Commitment to Racial Equity</span></strong></a></p>
</div><a href="https://bsd405.org/get-involved/community-partners/"><img width="1024" height="485" src="https://bsd405.org/wp-content/uploads/2019/04/family-community-red-hex-1140x540-1024x485.png" class="attachment-large size-large" alt="Family &amp; Community" decoding="async" loading="lazy" srcset="https://bsd405.org/wp-content/uploads/2019/04/family-community-red-hex-1140x540-1024x485.png 1024w, https://bsd405.org/wp-content/uploads/2019/04/family-community-red-hex-1140x540-300x142.png 300w, https://bsd405.org/wp-content/uploads/2019/04/family-community-red-hex-1140x540-768x364.png 768w, https://bsd405.org/wp-content/uploads/2019/04/family-community-red-hex-1140x540.png 1140w" sizes="(max-width: 1024px) 100vw, 1024px" /></a><div class="cs-column-text bsd-card"><p style="text-align: center;"><a href="https://bsd405.org/get-involved/community-partners/"><strong><span style="font-size: 17px;">Community Partners and Events</span></strong></a></p>
</div><hr class="cs-space"></div></div><div class="col-md-6"><div class="cs-column-inner"><div class="cs-divider-icon text-center"><div class="cs-divider-icon-inner cs-divider-icon-double"><span class="inner-text">District News</span></div></div><div class="blog-masonry one-column-blog"><div class="isotope-container"><div class="isotope-loading cs-loader"></div><div class="isotope-wrapper"><div class="row isotope-blog isotope-loop" data-layout="fitRows"><article id="post-84744" class="isotope-item col-md-6 post-84744 post type-post status-publish format-standard has-post-thumbnail hentry category-district category-district-news category-featured-top category-board category-superintendent">
  <div class="blog-masonry-border">

    <div class="entry-image"><a href="https://bsd405.org/2023/06/swearing-in-ceremony-of-incoming-superintendent-dr-kelly-aramaki/" class="post-thumbnail"><img width="848" height="400" src="https://bsd405.org/wp-content/uploads/2023/06/Dr-Aramaki-Swearing-in-Thumbnail-848x400.png" class="attachment-blog-large-image size-blog-large-image wp-post-image" alt="Photo of Dr. Kelly Aramaki with “New Superintendent Swearing-In&quot; text on green background." decoding="async" loading="lazy" srcset="https://bsd405.org/wp-content/uploads/2023/06/Dr-Aramaki-Swearing-in-Thumbnail-848x400.png 848w, https://bsd405.org/wp-content/uploads/2023/06/Dr-Aramaki-Swearing-in-Thumbnail-300x142.png 300w" sizes="(max-width: 848px) 100vw, 848px" /><span class="entry-image-overlay"></span></a></div><!-- entry-image -->
    <header class="entry-header">

      <h2 class="entry-title"><a href="https://bsd405.org/2023/06/swearing-in-ceremony-of-incoming-superintendent-dr-kelly-aramaki/" rel="bookmark">Attend the Swearing-In Ceremony of Incoming Superintendent, Dr. Kelly Aramaki</a></h2>
      <div class="entry-meta">
        <span class="entry-date"><a href="https://bsd405.org/2023/06/swearing-in-ceremony-of-incoming-superintendent-dr-kelly-aramaki/" rel="bookmark"><time class="entry-date" datetime="2023-06-05T11:59:06-07:00">June 5, 2023</time></a></span> <span class="entry-author-link"><span class="author vcard"><a class="url fn n" href="https://bsd405.org/author/culbrethg/" rel="author">George Culbreth</a></span></span><span class="entry-cat-links"><a href="https://bsd405.org/category/district/" rel="category tag">District</a>, <a href="https://bsd405.org/category/district-news/" rel="category tag">District News</a>, <a href="https://bsd405.org/category/featured-top/" rel="category tag">Featured Top</a>, <a href="https://bsd405.org/category/district/board/" rel="category tag">School Board</a>, <a href="https://bsd405.org/category/district/superintendent/" rel="category tag">Superintendent</a></span><span class="entry-love"><a href="#" class="entry-love-it" data-post-id="84744"><span class="love-count">5</span></a></span>      </div>

    </header><!-- /entry-header -->

        <div class="entry-summary"><p>The Bellevue School District learning community is invited to join the BSD School Board Directors on Thursday, June 8, 2023, for the swearing-in ceremony of the district’s Incoming Superintendent, Dr. Kelly Aramaki.<span class="entry-read-more"><a href="https://bsd405.org/2023/06/swearing-in-ceremony-of-incoming-superintendent-dr-kelly-aramaki/" class="cs-btn cs-btn-flat cs-btn-rounded cs-btn-xxs cs-btn-flat-accent">Read More</a></span></p>
</div><!-- /entry-summary -->
    
  </div>
</article><!-- /post-standard --><article id="post-85079" class="isotope-item col-md-6 post-85079 post type-post status-publish format-standard has-post-thumbnail hentry category-covid-19-health-and-safety category-district category-district-news category-health">
  <div class="blog-masonry-border">

    <div class="entry-image"><a href="https://bsd405.org/2023/06/free-covid-19-rapid-test-kits-for-bsd-students-staff-and-families/" class="post-thumbnail"><img width="848" height="400" src="https://bsd405.org/wp-content/uploads/2019/04/student-medical-dark-blue-hex-1140x540-848x400.png" class="attachment-blog-large-image size-blog-large-image wp-post-image" alt="Person icon and a first aid icon" decoding="async" loading="lazy" srcset="https://bsd405.org/wp-content/uploads/2019/04/student-medical-dark-blue-hex-1140x540-848x400.png 848w, https://bsd405.org/wp-content/uploads/2019/04/student-medical-dark-blue-hex-1140x540-300x142.png 300w" sizes="(max-width: 848px) 100vw, 848px" /><span class="entry-image-overlay"></span></a></div><!-- entry-image -->
    <header class="entry-header">

      <h2 class="entry-title"><a href="https://bsd405.org/2023/06/free-covid-19-rapid-test-kits-for-bsd-students-staff-and-families/" rel="bookmark">Free COVID-19 Rapid Test Kits for BSD Students, Staff and Families</a></h2>
      <div class="entry-meta">
        <span class="entry-date"><a href="https://bsd405.org/2023/06/free-covid-19-rapid-test-kits-for-bsd-students-staff-and-families/" rel="bookmark"><time class="entry-date" datetime="2023-06-12T11:14:40-07:00">June 12, 2023</time></a></span> <span class="entry-author-link"><span class="author vcard"><a class="url fn n" href="https://bsd405.org/author/culbrethg/" rel="author">George Culbreth</a></span></span><span class="entry-cat-links"><a href="https://bsd405.org/category/covid-19-health-and-safety/" rel="category tag">COVID-19 Health and Safety</a>, <a href="https://bsd405.org/category/district/" rel="category tag">District</a>, <a href="https://bsd405.org/category/district-news/" rel="category tag">District News</a>, <a href="https://bsd405.org/category/district/health/" rel="category tag">Health</a></span><span class="entry-love"><a href="#" class="entry-love-it" data-post-id="85079"><span class="love-count">0</span></a></span>      </div>

    </header><!-- /entry-header -->

        <div class="entry-summary"><p>BSD will be distributing free COVID-19 at-home rapid test kits to students, staff and their families throughout the summer.<span class="entry-read-more"><a href="https://bsd405.org/2023/06/free-covid-19-rapid-test-kits-for-bsd-students-staff-and-families/" class="cs-btn cs-btn-flat cs-btn-rounded cs-btn-xxs cs-btn-flat-accent">Read More</a></span></p>
</div><!-- /entry-summary -->
    
  </div>
</article><!-- /post-standard --><article id="post-84793" class="isotope-item col-md-6 post-84793 post type-post status-publish format-standard has-post-thumbnail hentry category-district category-district-news">
  <div class="blog-masonry-border">

    <div class="entry-image"><a href="https://bsd405.org/summer-resources/" class="post-thumbnail"><img width="848" height="400" src="https://bsd405.org/wp-content/uploads/2023/06/summer-resources-thumbnail-photo-848x400.jpg" class="attachment-blog-large-image size-blog-large-image wp-post-image" alt="Students standing together arm in arm." decoding="async" loading="lazy" srcset="https://bsd405.org/wp-content/uploads/2023/06/summer-resources-thumbnail-photo-848x400.jpg 848w, https://bsd405.org/wp-content/uploads/2023/06/summer-resources-thumbnail-photo-300x142.jpg 300w" sizes="(max-width: 848px) 100vw, 848px" /><span class="entry-image-overlay"></span></a></div><!-- entry-image -->
    <header class="entry-header">

      <h2 class="entry-title"><a href="https://bsd405.org/summer-resources/" rel="bookmark">Summer Resources</a></h2>
      <div class="entry-meta">
        <span class="entry-date"><a href="https://bsd405.org/summer-resources/" rel="bookmark"><time class="entry-date" datetime="2023-06-06T15:10:01-07:00">June 6, 2023</time></a></span> <span class="entry-author-link"><span class="author vcard"><a class="url fn n" href="https://bsd405.org/author/molmenb/" rel="author">Brock Molmen</a></span></span><span class="entry-cat-links"><a href="https://bsd405.org/category/district/" rel="category tag">District</a>, <a href="https://bsd405.org/category/district-news/" rel="category tag">District News</a></span><span class="entry-love"><a href="#" class="entry-love-it" data-post-id="84793"><span class="love-count">1</span></a></span>      </div>

    </header><!-- /entry-header -->

        <div class="entry-summary"><p>The 2022-2023 school year is nearly finished. Thursday, June 22, 2023, is the last day of this school year and will be a two-hour day for students. As we enter the summer season, here are resources to support our learning community.<span class="entry-read-more"><a href="https://bsd405.org/summer-resources/" class="cs-btn cs-btn-flat cs-btn-rounded cs-btn-xxs cs-btn-flat-accent">Read More</a></span></p>
</div><!-- /entry-summary -->
    
  </div>
</article><!-- /post-standard --><article id="post-84719" class="isotope-item col-md-6 post-84719 post type-post status-publish format-standard has-post-thumbnail hentry category-communications category-district category-district-news category-equity">
  <div class="blog-masonry-border">

    <div class="entry-image"><a href="https://bsd405.org/2023/06/bsd-celebrates-pride-in-our-communities/" class="post-thumbnail"><img width="844" height="400" src="https://bsd405.org/wp-content/uploads/2023/06/Pride-Month-2023-news-post-1140-×-540-px.png" class="attachment-blog-large-image size-blog-large-image wp-post-image" alt="" decoding="async" loading="lazy" /><span class="entry-image-overlay"></span></a></div><!-- entry-image -->
    <header class="entry-header">

      <h2 class="entry-title"><a href="https://bsd405.org/2023/06/bsd-celebrates-pride-in-our-communities/" rel="bookmark">BSD Celebrates Pride in Our Communities</a></h2>
      <div class="entry-meta">
        <span class="entry-date"><a href="https://bsd405.org/2023/06/bsd-celebrates-pride-in-our-communities/" rel="bookmark"><time class="entry-date" datetime="2023-06-02T14:03:15-07:00">June 2, 2023</time></a></span> <span class="entry-author-link"><span class="author vcard"><a class="url fn n" href="https://bsd405.org/author/molmenb/" rel="author">Brock Molmen</a></span></span><span class="entry-cat-links"><a href="https://bsd405.org/category/communications/" rel="category tag">Communications</a>, <a href="https://bsd405.org/category/district/" rel="category tag">District</a>, <a href="https://bsd405.org/category/district-news/" rel="category tag">District News</a>, <a href="https://bsd405.org/category/equity/" rel="category tag">Equity</a></span><span class="entry-love"><a href="#" class="entry-love-it" data-post-id="84719"><span class="love-count">5</span></a></span>      </div>

    </header><!-- /entry-header -->

        <div class="entry-summary"><p>During the month of June, the district celebrates Pride Month by affirming the identity of members of the LGBTQIA+ community and recognizing the impact that lesbian, gay, bisexual, transgender, and queer* individuals have had on our collective history.<span class="entry-read-more"><a href="https://bsd405.org/2023/06/bsd-celebrates-pride-in-our-communities/" class="cs-btn cs-btn-flat cs-btn-rounded cs-btn-xxs cs-btn-flat-accent">Read More</a></span></p>
</div><!-- /entry-summary -->
    
  </div>
</article><!-- /post-standard --><article id="post-84632" class="isotope-item col-md-6 post-84632 post type-post status-publish format-standard has-post-thumbnail hentry category-district category-district-news category-policies-procedures">
  <div class="blog-masonry-border">

    <div class="entry-image"><a href="https://bsd405.org/2023/05/policy-reading-12/" class="post-thumbnail"><img width="848" height="400" src="https://bsd405.org/wp-content/uploads/2019/04/policy-dark-green-hex-1140x540-848x400.png" class="attachment-blog-large-image size-blog-large-image wp-post-image" alt="document icon" decoding="async" loading="lazy" srcset="https://bsd405.org/wp-content/uploads/2019/04/policy-dark-green-hex-1140x540-848x400.png 848w, https://bsd405.org/wp-content/uploads/2019/04/policy-dark-green-hex-1140x540-300x142.png 300w" sizes="(max-width: 848px) 100vw, 848px" /><span class="entry-image-overlay"></span></a></div><!-- entry-image -->
    <header class="entry-header">

      <h2 class="entry-title"><a href="https://bsd405.org/2023/05/policy-reading-12/" rel="bookmark">Policy Reading</a></h2>
      <div class="entry-meta">
        <span class="entry-date"><a href="https://bsd405.org/2023/05/policy-reading-12/" rel="bookmark"><time class="entry-date" datetime="2023-05-26T16:17:26-07:00">May 26, 2023</time></a></span> <span class="entry-author-link"><span class="author vcard"><a class="url fn n" href="https://bsd405.org/author/molmenb/" rel="author">Brock Molmen</a></span></span><span class="entry-cat-links"><a href="https://bsd405.org/category/district/" rel="category tag">District</a>, <a href="https://bsd405.org/category/district-news/" rel="category tag">District News</a>, <a href="https://bsd405.org/category/policies-procedures/" rel="category tag">Policies &amp; Procedures</a></span><span class="entry-love"><a href="#" class="entry-love-it" data-post-id="84632"><span class="love-count">0</span></a></span>      </div>

    </header><!-- /entry-header -->

        <div class="entry-summary"><p>The following policies and procedures require a reading by the Bellevue School District School Board at the June 8, 2023 meeting: Second Reading and Adoption of Policies 3115, 3116, and 3220. <span class="entry-read-more"><a href="https://bsd405.org/2023/05/policy-reading-12/" class="cs-btn cs-btn-flat cs-btn-rounded cs-btn-xxs cs-btn-flat-accent">Read More</a></span></p>
</div><!-- /entry-summary -->
    
  </div>
</article><!-- /post-standard --></div><!-- isotope-blog --><div class="ajax-pagination"><a href="#" class="ajax-load-more cs-btn cs-btn-flat cs-btn-rounded cs-btn-xxs cs-btn-flat-accent" data-token="6487784437081">Load More<span class="cs-loader"></span></a></div></div><!-- isotope-wrapper --></div><!-- isotope-container --></div><hr class="cs-space"></div></div><div class="col-md-3"><div class="cs-column-inner"><div class="cs-divider-icon text-center"><div class="cs-divider-icon-inner cs-divider-icon-double"><span class="inner-text">Calendar</span></div></div><aside id="sidebar" class="bsd-card"><div class="route_widget widget_ai1ec_agenda_widget">


<style>
<!--

-->
</style>
<div class="timely ai1ec-agenda-widget-view ai1ec-clearfix">

			<div>
													<div class="ai1ec-date
					">
					<a class="ai1ec-date-title ai1ec-load-view"
						href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;about&#x2F;calendar&#x2F;action&#x7E;oneday&#x2F;exact_date&#x7E;6-14-2023&#x2F;">
						<div class="ai1ec-month">Jun</div>
						<div class="ai1ec-day">14</div>
						<div class="ai1ec-weekday">Wed</div>
											</a>
					<div class="ai1ec-date-events">
																					<div class="ai1ec-event
									ai1ec-event-id-79821
									ai1ec-event-instance-id-2398
									ai1ec-allday">

									<a href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;high-schools-graduation-ceremony-2023&#x2F;&#x3F;instance_id&#x3D;2398"
										class="ai1ec-popup-trigger ai1ec-load-event">
																					<span class="ai1ec-allday-badge">
												all-day
											</span>
										
										<span class="ai1ec-event-title">
											Bellevue, Interlake, Newport and...
																					</span>
									</a>

									<div class="ai1ec-popover ai1ec-popup 
	ai1ec-event-instance-id-2398">

		
	<span class="ai1ec-popup-title">
		<a href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;high-schools-graduation-ceremony-2023&#x2F;&#x3F;instance_id&#x3D;2398"
		   class="ai1ec-load-event"
			>Bellevue, Interlake, Newport and...</a>
					</span>

	
	<div class="ai1ec-event-time">
					Jun 14 <span class="ai1ec-allday-badge">all-day</span>
			</div>

	
			<div class="ai1ec-popup-excerpt">Read More</div>
	
</div>

								</div>
							 													 						 					</div>
				</div>
							<div class="ai1ec-date
					">
					<a class="ai1ec-date-title ai1ec-load-view"
						href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;about&#x2F;calendar&#x2F;action&#x7E;oneday&#x2F;exact_date&#x7E;6-15-2023&#x2F;">
						<div class="ai1ec-month">Jun</div>
						<div class="ai1ec-day">15</div>
						<div class="ai1ec-weekday">Thu</div>
											</a>
					<div class="ai1ec-date-events">
																					<div class="ai1ec-event
									ai1ec-event-id-79825
									ai1ec-event-instance-id-2400
									ai1ec-allday">

									<a href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;event&#x2F;international-and-big-picture-schools-graduation-ceremonies-2023&#x2F;&#x3F;instance_id&#x3D;2400"
										class="ai1ec-popup-trigger ai1ec-load-event">
																					<span class="ai1ec-allday-badge">
												all-day
											</span>
										
										<span class="ai1ec-event-title">
											International and Big Picture Sc...
																					</span>
									</a>

									<div class="ai1ec-popover ai1ec-popup 
	ai1ec-event-instance-id-2400">

		
	<span class="ai1ec-popup-title">
		<a href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;event&#x2F;international-and-big-picture-schools-graduation-ceremonies-2023&#x2F;&#x3F;instance_id&#x3D;2400"
		   class="ai1ec-load-event"
			>International and Big Picture Sc...</a>
					</span>

	
	<div class="ai1ec-event-time">
					Jun 15 <span class="ai1ec-allday-badge">all-day</span>
			</div>

	
			<div class="ai1ec-popup-excerpt">Read More</div>
	
</div>

								</div>
							 																					<div class="ai1ec-event
									ai1ec-event-id-84359
									ai1ec-event-instance-id-2647
									">

									<a href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;event&#x2F;sherwood-forest-moving-up-ceremony&#x2F;&#x3F;instance_id&#x3D;2647"
										class="ai1ec-popup-trigger ai1ec-load-event">
																					<span class="ai1ec-event-time">
												2:00 pm
											</span>
										
										<span class="ai1ec-event-title">
											Sherwood Forest Moving Up Ceremony
																					</span>
									</a>

									<div class="ai1ec-popover ai1ec-popup 
	ai1ec-event-instance-id-2647">

		
	<span class="ai1ec-popup-title">
		<a href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;event&#x2F;sherwood-forest-moving-up-ceremony&#x2F;&#x3F;instance_id&#x3D;2647"
		   class="ai1ec-load-event"
			>Sherwood Forest Moving Up Ceremony</a>
					</span>

	
	<div class="ai1ec-event-time">
					Jun 15 @ 2:00 pm
			</div>

	
			<div class="ai1ec-popup-excerpt">Read More</div>
	
</div>

								</div>
															<div class="ai1ec-event
									ai1ec-event-id-84354
									ai1ec-event-instance-id-2636
									">

									<a href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;event&#x2F;jing-mei-moving-up-ceremony&#x2F;&#x3F;instance_id&#x3D;2636"
										class="ai1ec-popup-trigger ai1ec-load-event">
																					<span class="ai1ec-event-time">
												2:20 pm
											</span>
										
										<span class="ai1ec-event-title">
											Jing Mei Moving Up Ceremony
																					</span>
									</a>

									<div class="ai1ec-popover ai1ec-popup 
	ai1ec-event-instance-id-2636">

		
	<span class="ai1ec-popup-title">
		<a href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;event&#x2F;jing-mei-moving-up-ceremony&#x2F;&#x3F;instance_id&#x3D;2636"
		   class="ai1ec-load-event"
			>Jing Mei Moving Up Ceremony</a>
					</span>

	
	<div class="ai1ec-event-time">
					Jun 15 @ 2:20 pm – 3:20 pm
			</div>

	
			<div class="ai1ec-popup-excerpt">Read More</div>
	
</div>

								</div>
							 						 					</div>
				</div>
							<div class="ai1ec-date
					">
					<a class="ai1ec-date-title ai1ec-load-view"
						href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;about&#x2F;calendar&#x2F;action&#x7E;oneday&#x2F;exact_date&#x7E;6-16-2023&#x2F;">
						<div class="ai1ec-month">Jun</div>
						<div class="ai1ec-day">16</div>
						<div class="ai1ec-weekday">Fri</div>
											</a>
					<div class="ai1ec-date-events">
																					<div class="ai1ec-event
									ai1ec-event-id-79822
									ai1ec-event-instance-id-2399
									ai1ec-allday">

									<a href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;event&#x2F;evergreen-and-bdd-graduation-ceremony-2023&#x2F;&#x3F;instance_id&#x3D;2399"
										class="ai1ec-popup-trigger ai1ec-load-event">
																					<span class="ai1ec-allday-badge">
												all-day
											</span>
										
										<span class="ai1ec-event-title">
											Evergreen Transition Program and...
																					</span>
									</a>

									<div class="ai1ec-popover ai1ec-popup 
	ai1ec-event-instance-id-2399">

		
	<span class="ai1ec-popup-title">
		<a href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;event&#x2F;evergreen-and-bdd-graduation-ceremony-2023&#x2F;&#x3F;instance_id&#x3D;2399"
		   class="ai1ec-load-event"
			>Evergreen Transition Program and...</a>
					</span>

	
	<div class="ai1ec-event-time">
					Jun 16 <span class="ai1ec-allday-badge">all-day</span>
			</div>

	
			<div class="ai1ec-popup-excerpt">Read More</div>
	
</div>

								</div>
							 																					<div class="ai1ec-event
									ai1ec-event-id-84361
									ai1ec-event-instance-id-2652
									">

									<a href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;event&#x2F;spiritridge-moving-up-ceremony&#x2F;&#x3F;instance_id&#x3D;2652"
										class="ai1ec-popup-trigger ai1ec-load-event">
																					<span class="ai1ec-event-time">
												9:30 am
											</span>
										
										<span class="ai1ec-event-title">
											Spiritridge Moving Up Ceremony
																					</span>
									</a>

									<div class="ai1ec-popover ai1ec-popup 
	ai1ec-event-instance-id-2652">

		
	<span class="ai1ec-popup-title">
		<a href="https&#x3A;&#x2F;&#x2F;bsd405.org&#x2F;event&#x2F;spiritridge-moving-up-ceremony&#x2F;&#x3F;instance_id&#x3D;2652"
		   class="ai1ec-load-event"
			>Spiritridge Moving Up Ceremony</a>
					</span>

	
	<div class="ai1ec-event-time">
					Jun 16 @ 9:30 am – 10:30 am
			</div>

	
			<div class="ai1ec-popup-excerpt">Read More</div>
	
</div>

								</div>
							 						 					</div>
				</div>
			 		</div>
	 
	 
</div>



<div class="clear"></div></div><div class="route_widget cs_widget_shortcode"><div class="textwidget"><a href="https://bsd405.org/about/calendar/" class="cs-btn cs-btn-flat cs-btn-rounded cs-btn-flat-accent cs-btn-md cs-btn-block"><i class="cs-in im im-arrow-right2"></i>View Calendar</a></div><div class="clear"></div><div class="clear"></div></div></aside></div></div></div></div></section>
      </div><!-- /content -->

    </div><!-- /main -->
	
	<!-- Begin Acknowledgement -->
	<div style="background-color: #23282d;">
		<div class="container" style="text-align: center; color: #fff; padding-top: 30px; padding-bottom: 30px;"><em>The Bellevue School District acknowledges that we learn, work, live and gather on the Indigenous Land of the Coast Salish peoples, specifically the Duwamish and Snoqualmie Tribes. We thank these caretakers of this land, who have lived and continue to live here, since time immemorial.</em></div>
	</div>
	<!-- End Acknowledgement -->
	
    <footer id="colophon" class="site-footer" role="contentinfo"><div class="container"><div class="row"><div class="col-md-3"><div class="widget_text route_widget widget_custom_html"><div class="textwidget custom-html-widget"><p><a href="//bsd405.org"><img src="//bsd405.org/wp-content/uploads/2015/05/BSD-logo-white-75.png" alt="Bellevue School District Logo"></a></p>
<form style="color:#333333;">
<label style="color:#ffffff;" for="select-school">Select School</label>
<select id="select-school" name="school" onchange="window.location.href=this.value">
<optgroup label="High Schools">
<option value="/bhs">Bellevue</option>
<option value="/interlake">Interlake</option>
<option value="/nhs">Newport</option>
<option value="/sammamish">Sammamish</option>
</optgroup>
<optgroup label="Middle Schools">
<option value="/chinook">Chinook</option>
<option value="/highland">Highland</option>
<option value="/odle">Odle</option>
<option value="/tillicum">Tillicum</option>
<option value="/tyee">Tyee</option>
</optgroup>
<optgroup label="Choice Schools">
<option value="/schools/choice/online-school">Bellevue Digital Discovery</option>
<option value="/bigpicture">Big Picture</option>
<option value="/international">International</option>
<option value="/jingmei">Jing Mei</option>
<option value="/puestadelsol">Puesta del Sol</option>
</optgroup>
<optgroup label="Elementary Schools">
<option value="/ardmore">Ardmore</option>
<option value="/bennett">Bennett</option>
<option value="/cherrycrest">Cherry Crest</option>
<option value="/clydehill">Clyde Hill</option>
<option value="/eastgate">Eastgate</option>
<option value="/enatai">Enatai</option>
<option value="/lakehills">Lake Hills</option>
<option value="/medina">Medina</option>
<option value="/newport">Newport Heights</option>
<option value="/phantomlake">Phantom Lake</option>
<option value="/sherwoodforest">Sherwood Forest</option>
<option value="/somerset">Somerset</option>
<option value="/spiritridge">Spiritridge</option>
<option value="/stevenson">Stevenson</option>
<option value="/wilburton">Wilburton</option>
<option value="/woodridge">Woodridge</option>
</optgroup>
</select>
</form></div><div class="clear"></div></div></div><div class="col-md-3"><div class="widget_text route_widget widget_custom_html"><div class="textwidget custom-html-widget"><h2 class="footer-h2">Contact Us</h2>
<ul>
	<li><a href="/help/contact/"><i class="fa fa-fw fa-map-marker" aria-hidden="true"></i> 12111 NE 1st St, Bellevue, WA 98005</a></li>
	<li><a href="https://bsd405.org/lets-talk/"><i class="fa fa-fw fa-question-circle" aria-hidden="true"></i> Let's Talk</a></li>
	<li><a href="tel:1-425-456-4000"><i class="fa fa-fw fa-phone" aria-hidden="true"></i> (425) 456-4000</a></li>
	<li><a href="mailto:pubinfo@bsd405.org"><i class="fa fa-fw fa-envelope" aria-hidden="true"></i> pubinfo@bsd405.org</a></li>
	<li><a href="mailto:webmaster@bsd405.org"><i class="fa fa-fw fa-envelope" aria-hidden="true"></i> webmaster@bsd405.org</a></li>
</ul></div><div class="clear"></div></div></div><div class="col-md-3"><div class="widget_text route_widget widget_custom_html"><div class="textwidget custom-html-widget"><h2 class="footer-h2">District</h2>
<ul>
		<li><a href="/notices">Official Notices</a></li>
	<li><a href="/about/policies-procedures/">Policies &amp; Procedures</a></li>
	<li><a href="/jobs/">Employment</a></li>
	<li><a href="/website-accessibility/">Website Accessibility</a></li>
</ul></div><div class="clear"></div></div></div><div class="col-md-3"><div class="widget_text route_widget widget_custom_html"><div class="textwidget custom-html-widget"><h2 class="footer-h2">Stay Connected</h2>
<ul>
		<li><a href="/stayconnected">School Messenger</a></li>
	<li><a href="https://bsd405.us4.list-manage.com/subscribe?u=b5c7e83d77c24abd24e3c6d47&amp;id=d9deaae8ba">Email Newsletter</a></li>
	<li><a href="https://www.facebook.com/bsd405" aria-label="Facebook"><i class="fa fa-facebook-square fa-2x fa-fw" aria-hidden="true"></i></a><a href="https://twitter.com/thebsd405" aria-label="Twitter"><i class="fa fa-twitter-square fa-2x fa-fw" aria-hidden="true"></i></a><a href="https://www.instagram.com/bellevueschools405/" aria-label="Instagram"><i class="fa fa-instagram fa-2x fa-fw" aria-hidden="true"></i></a><a href="https://www.youtube.com/c/bsd405" aria-label="YouTube"><i class="fa fa-youtube fa-2x fa-fw" aria-hidden="true"></i></a></li>
</ul></div><div class="clear"></div></div></div><div class="col-md-12"><div class="route_widget widget_text">			<div class="textwidget"><p>Bellevue School District does not discriminate in any programs or activities on the basis of sex, race, creed, religion, color, national origin, age, veteran or military status, sexual orientation, gender expression or identity, disability, or the use of a trained dog guide or service animal and provides equal access to the Boy Scouts of America and other designated youth groups. The following employees have been designated to handle questions and complaints of alleged discrimination:</p><ul style="margin-top: 0; margin-bottom: 20px; padding-left: 40px; list-style-type: disc;"><li style="border-bottom: 0px; padding-bottom: 0px">Civil Rights, Racial Discrimination, and Gender Expression or Identity Discrimination: Civil Rights/Nondiscrimination Compliance Coordinator Nancy Pham, (425) 456-4040 or <a href="mailto:phamn@bsd405.org">phamn@bsd405.org</a></li><li style="border-bottom: 0px; padding-bottom: 0px">Sex-based Discrimination, including Sexual Harassment: Title IX Coordinator: Jeff Lowell, (425) 456-4010 or <a href="mailto:lowellj@bsd405.org">lowellj@bsd405.org</a></li><li style="border-bottom: 0px; padding-bottom: 0px">Disability Discrimination: Section 504/ADA Coordinator: Heather Edlund, (425) 456-4156 or <a href="mailto:edlundh@bsd405.org">edlundh@bsd405.org</a></li></ul><p>Mailing address for all three: 12111 NE 1st Street, Bellevue, WA 98005.</p><p>The Bellevue School District is also committed to providing a safe and civil educational environment that is free from harassment, intimidation, or bullying. Report harassment, intimidation or bullying with Vector Alert or at your school. The Harassment, Intimidation and Bullying Compliance Officer is Nancy Pham, (425) 456-4040 or <a href="mailto:phamn@bsd405.org">phamn@bsd405.org</a>.</p>
</div>
		<div class="clear"></div></div></div></div></div></footer><div id="copyright"><div class="container"><div class="row"><div class="col-md-12"><i class="fa fa-graduation-cap"></i> The Vision of the Bellevue School District is to affirm and inspire each and every student to learn and thrive as creators of their future world.</div></div></div></div><!-- /footer -->

  </div><!-- /page -->

  <div id="cs-top" class="fa fa-chevron-up"></div>

  <script type="text/javascript"><!-- Hotjar Tracking Code for https://bsd405.org -->
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:178253,hjsv:5};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'//static.hotjar.com/c/hotjar-','.js?sv=');
</script>
      <script>
        jQuery(document).ready(function($) {
            $('.pdf-form a[href$=".pdf"]')
                .attr('download', '')
                .attr('target', '_blank')
                .attr('href', function(index, href) {
                    // Must remove the domain from the href due to browser security requiring download attribute to work only from the same domain URL.
                    return href.replace('https://bsd405.org/', '/');
                });
        });
    </script>
    <!-- Custom Feeds for Instagram JS -->
<script type="text/javascript">
var sbiajaxurl = "https://bsd405.org/wp-admin/admin-ajax.php";

</script>
<style type="text/css">.cs-btn-custom-648778441c353{background-color:#417298;color:#ffffff!important;padding:10px 20px 10px 20px; line-height:1.2em; min-width:280px;}.cs-btn-custom-648778441c353:hover{background-color:#6997bf;color:#ffffff!important;}.cs-btn-custom-648778441c369{background-color:#417298;color:#ffffff!important;padding:10px 20px 10px 20px; line-height:1.2em; min-width:280px;}.cs-btn-custom-648778441c369:hover{background-color:#6997bf;color:#ffffff!important;}.cs-btn-custom-648778441c377{background-color:#417298;color:#ffffff!important;padding:10px 20px 10px 20px; line-height:1.2em; min-width:280px;}.cs-btn-custom-648778441c377:hover{background-color:#6997bf;color:#ffffff!important;}.cs-btn-custom-648778441c383{padding:10px 20px 10px 20px; line-height:1.2em; min-width:280px;}.cs-btn-custom-648778441c38d{padding:10px 20px 10px 20px; line-height:1.2em; min-width:280px;}.cs-btn-custom-648778441ff98{background-color:#6e6e6e;color:#ffffff!important;padding:8px 8px;}.cs-btn-custom-648778441ff98:hover{background-color:#8e8e8e;color:#ffffff!important;}.cs-btn-custom-648778441ffab{background-color:#6e6e6e;color:#ffffff!important;padding:8px 8px;}.cs-btn-custom-648778441ffab:hover{background-color:#8e8e8e;color:#ffffff!important;}.cs-btn-custom-648778441ffb8{background-color:#6e6e6e;color:#ffffff!important;padding:8px 8px;}.cs-btn-custom-648778441ffb8:hover{background-color:#8e8e8e;color:#ffffff!important;}.cs-btn-custom-648778441ffc3{background-color:#6e6e6e;color:#ffffff!important;padding:8px 8px;}.cs-btn-custom-648778441ffc3:hover{background-color:#8e8e8e;color:#ffffff!important;}.cs-btn-custom-648778441ffcf{background-color:#6e6e6e;color:#ffffff!important;padding:8px 8px;}.cs-btn-custom-648778441ffcf:hover{background-color:#8e8e8e;color:#ffffff!important;}.cs-btn-custom-648778441ffd9{background-color:#6e6e6e;color:#ffffff!important;padding:8px 8px;}.cs-btn-custom-648778441ffd9:hover{background-color:#8e8e8e;color:#ffffff!important;}</style><script type='text/javascript' src='https://bsd405.org/wp-content/themes/route/js/jquery.plugins.min.js' id='cs-jquery-plugins-js'></script>
<script type='text/javascript' id='cs-jquery-register-js-extra'>
/* <![CDATA[ */
var cs_ajax = {"ajaxurl":"https:\/\/bsd405.org\/wp-admin\/admin-ajax.php","is_mobile":"0","siteurl":"https:\/\/bsd405.org\/wp-content\/themes\/route","loved":"Already loved!","error":"Error!","nonce":"9172b679aa","viewport":"768","sticky":"","header":"60","accent":"#537f20","non_responsive":"","no_smoothscroll":"0"};
var cs_load_more_6487784437081 = {"nav":"load","template":"grid","posts_per_page":"5","size":"blog-large-image","columns":"2","max_pages":"219","post_type":"post","isotope":"1","cats":"440"};
/* ]]> */
</script>
<script type='text/javascript' src='https://bsd405.org/wp-content/themes/route/js/jquery.register.js' id='cs-jquery-register-js'></script>
<script type='text/javascript' id='wp-accessibility-js-extra'>
/* <![CDATA[ */
var wpa = {"skiplinks":{"enabled":true,"output":"<div class=\"wpa-hide-ltr\" id=\"skiplinks\" role=\"navigation\" aria-label=\"Skip links\"><a href=\"#content\" class='no-scroll et_smooth_scroll_disabled'>Skip to Content<\/a> <a href=\"#site-nav\" class='no-scroll et_smooth_scroll_disabled'>Skip to navigation<\/a> <a href=\"\/\/bsd405.org\/help\/sitemap\/\" class='no-scroll et_smooth_scroll_disabled'>Site map<\/a> <a href=\"#top-bar\" class='no-scroll et_smooth_scroll_disabled'>quick links<\/a> <\/div>"},"target":"","tabindex":"1","underline":{"enabled":false,"target":"a"},"dir":"ltr","lang":"en-US","titles":"1","labels":"","wpalabels":{"s":"Search","author":"Name","email":"Email","url":"Website","comment":"Comment"},"current":"","errors":""};
/* ]]> */
</script>
<script type='text/javascript' src='https://bsd405.org/wp-content/plugins/wp-accessibility/js/wp-accessibility.js?ver=1.6.1' id='wp-accessibility-js'></script>
<script type='text/javascript' id='longdesc.button-js-extra'>
/* <![CDATA[ */
var wparest = {"url":"https:\/\/bsd405.org\/wp-json\/wp\/v2\/media","text":"<span class=\"dashicons dashicons-media-text\" aria-hidden=\"true\"><\/span><span class=\"screen-reader\">Long Description<\/span>"};
/* ]]> */
</script>
<script type='text/javascript' src='https://bsd405.org/wp-content/plugins/wp-accessibility/js/longdesc.button.js?ver=1.6.1' id='longdesc.button-js'></script>
<script type='text/javascript' id='gt_widget_script_38316863-js-before'>
window.gtranslateSettings = /* document.write */ window.gtranslateSettings || {};window.gtranslateSettings['38316863'] = {"default_language":"en","languages":["en","es","zh-CN","zh-TW","ar","ru","vi","ko","ja","so","am","sq","pa","pt","mn","km","sw","tr","uk","hi","ur","ro","af","hy","az","eu","be","bn","bs","bg","ca","ceb","ny","co","hr","cs","da","nl","eo","et","tl","fi","fr","fy","gl","ka","de","el","gu","ht","ha","haw","iw","hmn","hu","is","ig","id","ga","it","jw","kn","kk","ku","ky","lo","la","lv","lt","lb","mk","mg","ms","ml","mt","mi","mr","my","ne","no","ps","fa","pl","sm","gd","sr","st","sn","sd","si","sk","sl","su","sv","tg","ta","te","th","uz","cy","xh","yi","yo","zu"],"url_structure":"none","native_language_names":1,"wrapper_selector":"#gt-wrapper-38316863","select_language_label":"Select Language","horizontal_position":"inline","flags_location":"\/wp-content\/plugins\/gtranslate\/flags\/"};
</script><script src="https://bsd405.org/wp-content/plugins/gtranslate/js/dropdown.js?ver=6.2.2" data-no-optimize="1" data-no-minify="1" data-gt-orig-url="/" data-gt-orig-domain="bsd405.org" data-gt-widget-id="38316863" defer></script><script type='text/javascript' src='https://bsd405.org/wp-content/plugins/js_composer/assets/js/dist/js_composer_front.min.js?ver=6.10.0' id='wpb_composer_front_js-js'></script>
<script type='text/javascript' id='sbi_scripts-js-extra'>
/* <![CDATA[ */
var sb_instagram_js_options = {"font_method":"svg","resized_url":"https:\/\/bsd405.org\/wp-content\/uploads\/sb-instagram-feed-images\/","placeholder":"https:\/\/bsd405.org\/wp-content\/plugins\/instagram-feed-pro\/img\/placeholder.png","br_adjust":"1"};
var sbiTranslations = {"share":"Share"};
/* ]]> */
</script>
<script type='text/javascript' src='https://bsd405.org/wp-content/plugins/instagram-feed-pro/js/sbi-scripts.min.js?ver=6.2.4' id='sbi_scripts-js'></script>
<script type='text/javascript' src='https://bsd405.org/wp-content/themes/route/js/vendor/jquery.royalslider.min.js?ver=9.5.1' id='cs-royalslider-js'></script>
<script type='text/javascript' src='https://bsd405.org/?ai1ec_render_js=common_frontend&#038;is_backend=false&#038;ver=3.0.0' id='ai1ec_requirejs-js'></script>
  <!-- end wp_footer cs -->
  </body>
</html>

<script>(function(d, s, id) {var js, fjs = d.getElementsByTagName(s)[0];window.key='WN6Z9GLT@PY4F5LT';window.url='//www.k12insight.com/';if (d.getElementById(id))return;js = d.createElement(s);js.id = id;js.src = "//www.k12insight.com/Lets-Talk/LtTabJs.aspx";fjs.parentNode.insertBefore(js, fjs);}(document, 'script', 'Lets-Talk'));</script>
  `;
}


server.on("listening", () => {
  const addr = server.address();

  console.log(`Server running on port ${addr.port}`)
  console.log("");
  console.log("You can now view it in your browser.")
});
server.listen({ port: PORT })
