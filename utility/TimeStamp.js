const istToTimestamp = (dateString) => {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5.5
    return new Date(dateString).getTime() + istOffset;
}

module.exports = istToTimestamp;