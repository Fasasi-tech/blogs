exports.calculateReadingTime=(text)=>{

    const wordPerminutes =200;

    const totalWordCount = text.split(/\s+/);

    const totalCountResult = totalWordCount.length;

    const time = Math.ceil(totalCountResult / wordPerminutes)

    return `${time} min read`;
}