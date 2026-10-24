function requiredFields(data, fields) {
    const missing = [];

    for (const field of fields) {
        if (
            data[field] === undefined ||
            data[field] === null ||
            data[field] === ""
        ) {
            missing.push(field);
        }
    }

    return missing;
}

module.exports = {
    requiredFields
};