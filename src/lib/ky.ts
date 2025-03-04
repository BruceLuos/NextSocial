import ky from "ky";

/** ky请求实例 */
const kyInstance = ky.create({
  parseJson: (text) =>
    JSON.parse(text, (key, value) => {
      if (key.endsWith("At")) return new Date(value); // Convert all keys ending with "At" to Date
      return value;
    }),
});

export default kyInstance;
