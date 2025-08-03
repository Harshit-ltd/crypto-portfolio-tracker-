
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import requests
from sqlalchemy.exc import IntegrityError

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

app.secret_key = 'super_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///crypto_tracker.db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

class Portfolio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    coin_symbol = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Float, nullable=False)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(username=data['username'], password=hashed_pw)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password, password):
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Invalid credentials"}), 401


@app.route('/portfolio', methods=['GET', 'POST'])
def portfolio():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    if request.method == 'POST':
        data = request.get_json()
        new_coin = Portfolio(user_id=session['user_id'], coin_symbol=data['symbol'], amount=data['amount'])
        db.session.add(new_coin)
        db.session.commit()
        return jsonify({'message': 'Coin added'})
    else:
        coins = Portfolio.query.filter_by(user_id=session['user_id']).all()
        return jsonify([{'symbol': c.coin_symbol, 'amount': c.amount} for c in coins])

@app.route('/coin_history/<symbol>', methods=['GET'])
def coin_history(symbol):
    currency = request.args.get('currency', 'usd')
    response = requests.get(f'https://api.coingecko.com/api/v3/coins/{symbol}/market_chart',
                            params={'vs_currency': currency, 'days': '30'})
    if response.status_code == 200:
        return jsonify(response.json())
    return jsonify({'message': 'Error fetching data'}), 400

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
