var portal = require('/lib/xp/portal');
var cacheLib = require('/lib/xp/cache');

// Sizes of images generated:
var sizes = [57, 60, 72, 76, 114, 120, 144, 152, 180]; // rel=apple-touch-icon
var altSizes = [16, 32, 96, 192]; // rel=icon

exports.responseFilter = function (req, res) {
  var siteConfig = portal.getSiteConfig();
  var imageId = siteConfig.favicon;

  if (!imageId) {
    return res;
  }

  var headEnd = res.pageContributions.headEnd;
  if (!headEnd) {
    res.pageContributions.headEnd = [];
  } else if (typeof(headEnd) === 'string') {
    res.pageContributions.headEnd = [headEnd];
  }

  res.pageContributions.headEnd.push(createMetaLinks(siteConfig));

  return res;
};

function createMetaLinks(siteConfig) {
  var cache = cacheLib.newCache({
    size: 100,
    expire: siteConfig.ttl || 300
  });

  var createImageUrl = getCreateImageFn(siteConfig.favicon);

  return cache.get('favicon-image-generator-cache', function () {
    return [
      createMetaLink(64, 'shortcut icon', 'image/png')
    ]
      .concat(sizes.map(function (size) {
        return createMetaLink(size, 'apple-touch-icon');
      }))
      .concat(altSizes.map(function (size) {
        return createMetaLink(size, 'icon', 'image/png');
      }))
      .join('\n');
  });

  function createMetaLink(size, rel, type) {
    var imageUrl = createImageUrl('square(' + size + ')');
    var typeStr = type ? 'type="' + type + '"' : '';
    var sizes = 'sizes="' + size + 'x' + size + '" ';
    return '<link rel="' + (rel || 'icon') + '" ' + sizes + 'href="' + imageUrl + '" ' + typeStr + ' />';
  }
}

function getCreateImageFn(imageId) {
  return function (scale, format) {
    return portal.imageUrl({
      id: imageId,
      scale: scale,
      format: format || 'jpg'
    });
  };
}
