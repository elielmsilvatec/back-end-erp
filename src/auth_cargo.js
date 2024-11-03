

function auth(req, res, next) {
    if (req.session.user === undefined) {
        res.redirect('/user/login');
        return;
    }

    if (req.session.user != undefined) {
        if (req.session.user === 'administrador'){
            next()
        }

        if (req.session.user.cargo != 'administrador'){
            req.flash('erro_msg', 'Acesso negado para este cargo.')
            return res.redirect('/user/cargo')
        }
     

    }

    next();
}



module.exports = auth