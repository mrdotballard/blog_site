
exports.embedImages = function embedImages(content) {
  content = content.replace('##img', '<img');
  content = content.replace('/##', '/>');
  return content;
}

