
exports.sanatizeHTML = function sanatizeHTML(content) {
  content = content.replace(/#o#/gi, '<');
  content = content.replace(/#c#/gi, '>');
  return content;
}

