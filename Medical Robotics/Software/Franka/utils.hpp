#ifndef UTILS_HPP_
#define UTILS_HPP_

// System include
#include <fstream>
#include <iomanip>
#include <sstream>
#include <string>
#include <iostream>
 
// Eigen Header files
#include <Eigen/Dense>

#ifdef _WIN32
   // For Windows Sleep(ms)
   #include <windows.h>
#endif //_WIN32

// NDI Header files //TODO: IT MAY BE REDUNDANT INCLUSION. CONSIDER REMOVAL
//#include "CombinedApi.h"

// User Types code
#define GENERIC_USER 1
#define TECH_USER 2

#define REPERE_POINTS_NUM 3

//from utils.hpp of M.E.R.T.E.N.S.	**************************************************

#include <vector>
#define SPACE_DIM 3

// Twist dimension
#ifndef TWIST_DIM
#define TWIST_DIM 6
#endif // TWIST_DIM

#define _USE_MATH_DEFINES
#include <math.h>

#define BUILD_PANDA_DYN_MODEL

namespace Eigen {

	typedef Eigen::Matrix<float, 6, 1> Vector6f;
	typedef Eigen::Matrix<double, 6, 1> Vector6d;
	typedef Eigen::Matrix<float, 6, 6> Matrix6f;
	typedef Eigen::Matrix<double, 6, 6> Matrix6d;
	typedef Eigen::Matrix<float, 7, 1> Vector7f;
	typedef Eigen::Matrix<double, 7, 1> Vector7d;
	typedef Eigen::Matrix<int, 6, 6> Matrix6i;
	typedef Eigen::Matrix<int, 6, 1> Vector6i;

}
//M.E.R.T.E.N.S.				**************************************************

enum OP_MODE { PLANAR_4D, PARABOLA_5D, TARGET_BASED, READING}; //READING: read desired pose from VREP scene

// Action type defines
enum USER_CASES { QUIT_INPUT = 0, REGISTRATION, DESIRED_POSE, TRACKING };


/**
* @brief Extract data function
* Extract the expected data from the content of the settings file to save data properly (set internally the antenna transformation)
* @param content: the vector of strings with the content of the read file
* @return true if the data extraction is successful, false otherwise
*/
bool extractEigenTransform(const std::vector < std::string >& content, Eigen::Matrix4d& T);


/**
* @brief Print function
* Print if DEBUG preprocessor condition active
*/
template <typename T>
void debugPrint(const char* text, const T& data) {

#ifdef DEBUG
	std::cout << text << "\n" << data;
#endif // DEBUG

}



/**
* @ Template radiant 2 degrees conversion function
* Convert input degree data in radiant
* @param in: input degree data
* @return out: output radiant data
*/
template<class T>
T rad2deg(const T& in) {

	T out;

	out = in * 180.0 / M_PI;

	return out;

}

/**
* @ Template degree 2 radiant conversion function
* Convert input radiant data in radiant
* @param in: input radiant data
* @return out: output degree data
*/
template<class T>
T deg2rad(const T& in) {

	T out;

	out = in * M_PI / 180.0;

	return out;

}

/**
* @brief Rotation matrix 2 Roll Pitch Yaw angles
* Convert the input rotation matrix in the corresponding triple of roll pitch yaw angles
*/
Eigen::Vector3d rot2rpy(const Eigen::Matrix3d& R);

/**
* @brief Roll Pitch Yaw angles 2 Rotation matrix 
* Convert the input triple of roll pitch yaw angles in the corresponding rotation matrix
*/
Eigen::Matrix3d rpy2rot(const Eigen::Vector3d& rpy);

/**
* @brief Conversion function
* Convert the pair (row,column) in the corresponding index in a matrix with c cols
* @param c the number of columns of the matrix
* @param i the row index
* @param j the column index
* @return idx the corresponding index of the matrix entry
*/
int sub2ind(const int& c, const int& i, const int& j);

/**
* @brief Conversion function
* Convert the matix entry index in the corresponding pair (row,column) 
* @param c the number of columns of the matrix
* @param idx the matrix entry index
* @param [out]: i the row index
* @param [out]: j the column index
* @return idx the corresponding index of the matrix entry
*/
void ind2sub(const int& c, const int& idx, int& i, int& j);



#ifdef _WIN32
/**
* @brief There's no standard cross platform sleep() method prior to C++11
*/
void sleepSeconds(unsigned numSeconds);
#endif


//from utils.hpp of M.E.R.T.E.N.S.	**************************************************

/**
* @brief Skew-symmetric matrix function
* Compute the skew-symmetric matrix of the input vector
* @param v: the input vector
* @param the skew-symmetric matrix
*/
Eigen::Matrix3f skew(const Eigen::Vector3f& v);

/**
* @brief Utility function
* parse the input string line into an array of doubled-precision floating values
* @param the input string line
* @return the corresponding vector of double-precision floating values
*/
std::vector < double > parseCSVLine(const std::string& line);
//M.E.R.T.E.N.S.				   **************************************************

/** Utility messages**/ /// <--- Maybe these cane become exceptions (future development)
/**
* @brief Initial welcome message of the software
*/
char* welcomeMessage();

/**
* @brief show the wrong input message
*/
char* wrongInputMessage();

/**
* @brief show the not available option message
*/
char* notAvailableOptionMessage();

/**
* @brief show the not available tool name message
*/
char* wrongOptionMessage();

/**
* @brief show the dismissal message
*/
char* dismissalMessage();

#endif //UTILS_HPP_
