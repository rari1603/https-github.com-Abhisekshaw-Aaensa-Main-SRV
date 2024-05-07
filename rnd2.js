let timestamps = [
    { "TimeStamp": "1710915507" },
    { "TimeStamp": "1710915507" },
    { "TimeStamp": "1710915507" },
    { "TimeStamp": "1710915515" },
    { "TimeStamp": "1710915516" }
];

let timestampToFind = "1710915507";

let objectsWithTimestamp = timestamps.filter(obj => obj.TimeStamp === timestampToFind);

console.log(objectsWithTimestamp);
