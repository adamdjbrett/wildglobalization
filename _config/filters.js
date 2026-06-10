import { DateTime } from "luxon";

export default function(eleventyConfig) {
	// Format tanggal
	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
	});

	eleventyConfig.addFilter("htmlDateString", (dateObj) => {
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat('yyyy-LL-dd');
	});

	// Author filters
	eleventyConfig.addFilter("getAuthor", (authors, label) => {
		let author = authors.filter(a => a.key === label)[0];
		return author;
	});

	eleventyConfig.addFilter("getPostsByAuthor", (posts, author) => {
		return posts.filter(a => a.data.author === author);
	});

	// Limit filter untuk Nunjucks
	eleventyConfig.addNunjucksFilter("limit", (arr, limit) => arr.slice(0, limit));

	// Min filter (hanya sekali)
	eleventyConfig.addFilter("min", (...numbers) => {
		return Math.min.apply(null, numbers);
	});

	// Head filter (ambil n elemen pertama)
	eleventyConfig.addFilter("head", (array, n) => {
		if (!Array.isArray(array) || array.length === 0) return [];
		if (n < 0) return array.slice(n);
		return array.slice(0, n);
	});

	// Mengambil keys dari object
	eleventyConfig.addFilter("getKeys", target => {
		return Object.keys(target);
	});

	eleventyConfig.addFilter("sortAlphabetically", (arr) => {
		if (!Array.isArray(arr)) return arr;
		return arr.slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
	});

	// Filter untuk mengecualikan tag-tag tertentu
	eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
		const excludeTags = [
			"all", "posts", "pages", "tags"
		];
		return (tags || []).filter(tag => !excludeTags.includes(tag));
	});
}