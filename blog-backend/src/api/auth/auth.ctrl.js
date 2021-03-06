import Joi from 'joi';
import User from '../../models/user';

 // Join Membership
export const register = async (ctx) => {
   const schema = Joi.object().keys({
       username: Joi.string().alphanum().min(3).max(20).required(),
       password: Joi.string().required(),
   });

   const result = schema.validate(ctx.request.body);
   if (result.error) {
       ctx.status = 400;
       ctx.body = result.error;
       return;
   }
   const { username, password } = ctx.request.body;

   try {
       const exists = await User.findByUsername(username);
       if (exists) {
           ctx.status = 409; // Conflict
           return;
       }
       const user = new User({
           username,
       });
       await user.setPassword(password); // Set Password
       await user.save() // Save in Database

      ctx.body = user.serialize();

      const token = user.generateToken();
      ctx.cookies.set('access_token', token, {
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
          httpOnly: true,
      })
   } catch (e) {
       ctx.throw(500, e);
   }
};

// Login
export const login = async (ctx) => {
    const { username, password } = ctx.request.body;

    if (!username || !password) {
        ctx.status = 401; // Unauthorized
        return;
    }

    try {
        const user = await User.findByUsername(username);

        if (!user) {
            ctx.status = 401;
            return;
        }

        const valid = await user.checkPassword(password);

        // Incorrect Password
        if (!valid) {
            ctx.status = 401;
            return;
        }

        ctx.body = user.serialize();

        const token = user.generateToken();
        ctx.cookies.set('access_token', token, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
        });
    } catch (e) {
        ctx.throw(500, e);
    }
};

// Check Login Status
export const check = async (ctx) => {
    const { user } = ctx.state;
     
    if (!user) {
        // Is not Logining
        ctx.status = 401;
        return;
    }
    ctx.body = user;
}

// Logout
export const logout = async (ctx) => {
    ctx.cookies.set('access_token');
    ctx.status = 204; // No Content
}