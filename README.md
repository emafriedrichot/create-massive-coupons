To execute this script 

1. Create a .env file
2. Fill the file .env with the `valid` values for every key in .env.example
3. npm start
4. Enjoy

A file called `generated-coupons.json` will be created with the generated coupon codes


Options:

- You can set a file path into process.env.COUPONS_TO_CREATE the will be (necessarily) a JSON file with an array of coupon codes to create in vtex.

- You can set a string `same-as-coupon-code` into process.env.UTM_SOURCE to indicate to the script that use the coupon code as utm source.

