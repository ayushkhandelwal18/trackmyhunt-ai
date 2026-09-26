const Resource = require("../models/resource.model");

// Only these fields are part of the resource structure. Legacy fields
// (status, relatedSkills) sent by older clients are ignored so they can
// never be written back to the document.
function pickResourceFields(data) {
    const source = data || {};
    const picked = {};
    ["title", "type", "link", "description"].forEach((key) => {
        if (source[key] !== undefined) picked[key] = source[key];
    });
    return picked;
}

exports.createResource = async (userId, data) => {
    return await Resource.create({ ...pickResourceFields(data), user: userId });
};

exports.getResources = async (userId) => {
    return await Resource.find({ user: userId }).sort({ createdAt: -1 });
};

exports.updateResource = async (id, userId, data) => {
    const resource = await Resource.findOne({ _id: id, user: userId });
    if (!resource) throw new Error("Resource not found");

    Object.assign(resource, pickResourceFields(data));
    return await resource.save();
};

exports.deleteResource = async (id, userId) => {
    const resource = await Resource.findOneAndDelete({ _id: id, user: userId });
    if (!resource) throw new Error("Resource not found");
    return resource;
};
