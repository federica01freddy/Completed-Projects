#include "DBWrapper.hpp"

// System header files
#include <fstream>
#include <iostream>

/**
* @brief Default constructor of the DBWrapper class
*/
DBWrapper::DBWrapper(){}


/**
* @brief Constructor of the DBWrapper class with the filename argument
*/
DBWrapper::DBWrapper(const char* file_){

	this->file = file_;

}

/**
* @brief Default destroyer of the DBWrapper class
*/
DBWrapper::~DBWrapper(){}

/**
* @brief Open function
* Open the the given file
*/
void DBWrapper::open(){}

/**
* @brief Write function
* Write the input content on the given file
* @param filename the name of the file on which the content has to be written
* @param the content to be written on the file
* @return true if the content has been successfulyy saved on the input file
*/
bool DBWrapper::write(const char* filename, std::stringstream& content) {

	std::ofstream outFile;

	outFile.open(filename, std::ofstream::out);

	outFile << content.str();

	return true;


}

/**
* @brief Read function
* Read the content on the given file
* @return a pair of strings, containing i) the keyword of the values and ii) the value itself
*/
std::vector < std::string > DBWrapper::read(){
	std::ifstream inFile;
	std::vector < std::string > content;
	std::string line;

	std::cout << "this->file = " << this->file << std::endl;

	// Open the file
	inFile.open(this->file, std::ios_base::in);

#ifdef DEBUG
	//std::cout << "File path: " << this->file << std::endl;
#endif //DEBUG


	if (!inFile){ // if cannot open the file
		std::string error;
		error = "ERROR";
		content.push_back(error);
		std::cout << "Cannot open the file " << this->file << std::endl;
	}
	else{
		while (!inFile.eof()){
			
			// Extract the current line
			std::getline(inFile, line);
			
			if (line.length() > 0){ // if not empty line ...
				if (line.find("#") == std::string::npos){ // ... and not comment line

					// Store the current line in the output structure
					content.push_back(line);
				}
			}
		}
	}

#ifdef DEBUG
	//std::cout << "Content of the file: " << std::endl;
#endif //DEBUG

	/*for (int i = 0; i < content.size(); i++){
	
#ifdef DEBUG
		std::cout << content[i] << std::endl;
#endif //DEBUG
	
	}//*/

	return content;

}


/**
* @brief Read and parse function
* Read and parse the content of the using file by separating the upper comment and the lower value
* @return a vector of strings, containing i) the keyword of the values and ii) the value itself
*/
std::vector < std::pair < std::string, std::string > > DBWrapper::readLabeledFile() {


	std::ifstream inFile;
	std::vector < std::pair < std::string, std::string > > content;
	std::pair <std::string, std::string> contentPair_i;
	std::string line;

	// Open the file
	inFile.open(this->file, std::ios_base::in);

#ifdef DEBUG
	//std::cout << "File path: " << this->file << std::endl;
#endif //DEBUG

	// lineID = 0: looking for the commment line
	// lineID = 1: looking for the value line
	int lineID = 0;

	if (!inFile) { // if cannot open the file
		std::string error;
		std::pair <std::string, std::string> errorPair;
		errorPair.first = "ERROR";
		errorPair.second = "ERROR";
		content.push_back(errorPair);
	}
	else {

		while (!inFile.eof()) {

			// Extract the current line
			std::getline(inFile, line);

			if (line.length() > 0) { // if not empty line ...
				if (lineID == 0 && line.find("###") != std::string::npos) { // ... first comment line
					// Store the first element of the current pair as the comment line
					contentPair_i.first = line;
					lineID = 1;
				}
				else if (lineID == 1 && line.find("#") == std::string::npos) { // ... second value line
					// Store the first element of the current pair as the comment line
					contentPair_i.second = line;
					lineID = 0;

					content.push_back(contentPair_i);
				}
			}
		}
	}

	/*for (int i = 0; i < content.size(); i++){

	#ifdef DEBUG
		std::cout << content[i].first << std::endl;
		std::cout << content[i].second << std::endl;
#endif //DEBUG

	}//*/

	return content;


}




/**
* @brief Close function
* Close the given file
*/
void DBWrapper::close(){}