const d3 = require("d3-dsv")

module.exports = {
	thing_name: "wikipedia",
	thing_description: "Year end pice showing all the wikipedia articles from the year",
	thing_path: "/2021/wikipedia",
	gdoc_id: "1VT7iPUSnAxyoc_UUC3i0kkLBUOEvoEaks6YWriMjtbQ",
	gform_id: "",
	allow_multiple_responses: false,
	/*
	Are there local datafiles you want to pass through to the templates? 
	Specify their locations below and how to parse them.

	datafiles should be a list of objects that specify a filename `fn` and
	an optional function `parse` to parse the file. If no parser is specified
	JSON.parse will be used. e.g. [{ 
			fn: "bed-data.json",
			parser: JSON.parse
		},
		{
			fn: "table-data.json"
		},
		{
			fn: "chair-data.csv",
			parser: d3.csvParse
		}, 
		{
			fn: "desk-data.txt",
			parser: (rawFile) => rawFile.split("\n").map(row => row.split(/\s+/)) 
		}]

	*/
	datafiles: [{
		fn: "src/data/wiki.csv",
		parser: d3.csvParse
	}]
}