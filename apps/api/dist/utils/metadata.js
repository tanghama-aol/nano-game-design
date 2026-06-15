"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachMetadata = attachMetadata;
async function attachMetadata(base64Image, _node) {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    try {
        // Mock metadata attachment without Sharp to bypass binary compile errors in this environment
        return imageBuffer;
    }
    catch (error) {
        return imageBuffer;
    }
}
//# sourceMappingURL=metadata.js.map