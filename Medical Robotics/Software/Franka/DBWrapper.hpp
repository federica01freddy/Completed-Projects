#ifndef DBWRAPPER_HPP_
#define DBWRAPPER_HPP_

// System Header files
#include <sstream>
#include <vector>

class DBWrapper {


public:

	/**
	* @brief Default constructor of the DBWrapper class
	*/
	DBWrapper();

	/**
	* @brief Constructor of the DBWrapper class with the filename argument
	*/
	DBWrapper(const char* file_);

	/**
	* @brief Default destroyer of the DBWrapper class
	*/
	~DBWrapper();

	/**
	* @brief Set function
	* Set the name of the file to open
	* @param filename: the name of the file
	*/
	inline void setDBFile(const char* filename){ file = filename; }

	/**
	* @brief Open function
	* Open the the given file
	*/
	void open();

	/**
	* @brief Write function
	* Write the input content on the given file
	* @param filename the name of the file on which the content has to be written
	* @param the content to be written on the file
	* @return true if the content has been successfulyy saved on the input file
	*/
	bool write(const char* filename, std::stringstream& content);

	/**
	* @brief Read function
	* Read the content on the given file
	* @return a vector of strings, containing i) the keyword of the values and ii) the value itself 
	*/
	std::vector < std::string > read();

	/**
	* @brief Read and parse function
	* Read and parse the content of the using file by separating the upper comment and the lower value
	* @return a vector of strings, containing i) the keyword of the values and ii) the value itself
	*/
	std::vector < std::pair < std::string, std::string > > readLabeledFile();
	
	/**
	* @brief Close function
	* Close the given file
	*/
	void close();

private:

	const char* file;			//!< File to access for write/read procedures
	bool isOpen;				//!< Flag set to true if the file is successfully and currently open.
};


#endif //DBWRAPPER_HPP_