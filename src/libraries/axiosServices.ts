import axios from 'axios';
const axiosService = async (url: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.get(url);
            if (response.status === 200) {
                resolve(response.data);
            }
            return reject(response.data);
        } catch (error: any) {
            return reject(error && error.message);
        }
    })
}

export default axiosService;