// System Header files
#include <iostream>


// Project Header files
#include "utils.hpp"

Eigen::Vector3d rpy_last = Eigen::Vector3d::Zero();

/**
* @brief Rotation matrix 2 Roll Pitch Yaw angles
* Convert the input rotation matrix in the corresponding triple of roll pitch yaw angles
*/
Eigen::Vector3d rot2rpy(const Eigen::Matrix3d& R){

	Eigen::Vector3d rpy_p, rpy_m;
	double pitch_p = atan2(-R(2, 0), sqrt(R(2, 1)*R(2, 1) + R(2, 2)*R(2, 2)));
	double pitch_m = atan2(-R(2, 0), -sqrt(R(2, 1)*R(2, 1) + R(2, 2)*R(2, 2)));

	if (abs(abs(pitch_p) - M_PI / 2) < 0.001) {
		//std::cout <<  "ERROR: inverse kinematic singularity" << '\n';
	}

	double roll_p = atan2(R(2, 1) / cos(pitch_p), R(2, 2) / cos(pitch_p));
	double roll_m = atan2(R(2, 1) / cos(pitch_m), R(2, 2) / cos(pitch_m));

	double yaw_p = atan2(R(1, 0) / cos(pitch_p), R(0, 0) / cos(pitch_p));
	double yaw_m = atan2(R(1, 0) / cos(pitch_m), R(0, 0) / cos(pitch_m));

	rpy_p << roll_p, pitch_p, yaw_p;
	rpy_m << roll_m, pitch_m, yaw_m;//*/

	return rpy_p;

}


/**
* @brief Extract data function
* Extract the expected data from the content of the settings file to save data properly (set internally the antenna transformation)
* @param content: the vector of strings with the content of the read file
* @return true if the data extraction is successful, false otherwise
*/
bool extractEigenTransform(const std::vector < std::string >& content, Eigen::Matrix4d& T) {

	std::string line;
	std::string comma(",");
	std::string semicolumn(";");
	int commaPos = -1;

	if (content.size() != 4) {
#ifdef DEBUG
		std::cout << "ERROR: Wrong numbers of lines detected in the Registered Transformation file." << std::endl;
#endif //DEBUG
		return false;
	}

	for (int i = 0; i < content.size(); i++) {

		std::string val[4];
		line = content[i];

		for (int j = 0; j < 4; j++) {
			commaPos = line.find(comma);
			val[j] = line.substr(0, commaPos);
			line = line.substr(commaPos + 1, line.length());

			T(i, j) = std::stod(val[j]);
		}

	}
}





/**
* @brief Roll Pitch Yaw angles 2 Rotation matrix
* Convert the input triple of roll pitch yaw angles in the corresponding rotation matrix
*/
Eigen::Matrix3d rpy2rot(const Eigen::Vector3d& rpy) {
	Eigen::Matrix3d R;
	R	=     Eigen::AngleAxisd(rpy(2), Eigen::Vector3d::UnitZ())
			* Eigen::AngleAxisd(rpy(1), Eigen::Vector3d::UnitY())
			* Eigen::AngleAxisd(rpy(0), Eigen::Vector3d::UnitX());

	return R;
}

/**
* @brief Conversion function
* Convert the pair (row,column) in the corresponding index in a matrix with c cols
* @param c the number of columns of the matrix
* @param i the row index
* @param j the column index
* @return idx the corresponding index of the matrix entry
*/
int sub2ind(const int& c, const int& i, const int& j) {

	return j + i * c;

}

/**
* @brief Conversion function
* Convert the pair (row,column) in the corresponding index in a matrix with c cols
* @param c the number of columns of the matrix
* @param i the row index
* @param j the column index
* @return idx the corresponding index of the matrix entry
*/
void ind2sub(const int& c, const int& idx, int& i, int& j) {

	i = idx / c;
	j = idx % c;

}



#ifdef _WIN32
/**
* @brief There's no standard cross platform sleep() method prior to C++11
*/
void sleepSeconds(unsigned numSeconds)
{
	Sleep((DWORD)1000 * numSeconds); // Sleep(ms)
}
#endif


//from utils.hpp of M.E.R.T.E.N.S.		**************************************************

/**
* @brief Utility function
* parse the input string line into an array of doubled-precision floating values
* @param the input string line
* @return the corresponding vector of double-precision floating values
*/
std::vector < double > parseCSVLine(const std::string& line) {

	std::vector < double > vec;
	std::string comma(",");
	std::string semicolumn(";");

	std::string temp_line = line;
	bool endloop = false;
	while (!endloop && temp_line.length() > 0) {

		// Find the comma
		int delimiter = temp_line.find(comma);

		// If not found, look for the semicolumn
		if (delimiter == std::string::npos) {
			delimiter = temp_line.find(semicolumn);
			endloop = true;
		}

		// Assign the j-th value
		vec.push_back(std::stod(temp_line.substr(0, delimiter)));

		// Update the line
		temp_line = temp_line.substr(delimiter + 1, temp_line.length());
	}
	return vec;
}

/**
* @brief Skew-symmetric matrix function
* Compute the skew-symmetric matrix of the input vector
* @param v: the input vector
* @param the skew-symmetric matrix
*/
Eigen::Matrix3f skew(const Eigen::Vector3f& v) {

	Eigen::Matrix3f S;

	S << 0, -v(2), v(1),
		v(2), 0, -v(0),
		-v(1), v(0), 0;

	return S;
}
//M.E.R.T.E.N.S.					**************************************************


/** Utility messages**/ /// <--- Maybe these cane become exceptions (future development)
char* welcomeMessage(){

	/*return "Please select your user role (General User as default)\n" 
		"\t1 General User\n"
		"\t2 Technician \n\n";//*/

	return "";

}

char* wrongInputMessage(){

	return "\nWrong input.Please insert a correct number for the corresponding action to request.\n ";
}

char* notAvailableOptionMessage(){

	return "\nThe chosen option is not available in the current system configuration. \n";

}

char* wrongOptionMessage(){

	return "\nThe choice does not correspond to an available option. Repeat your choice: \n";

}

/**
* @brief show the dismissal message
*/
char* dismissalMessage(){

	return "\nOne is glad to be of service.";

}

