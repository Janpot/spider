FROM woorank/base

# install build tools
RUN npm install --global bower gulp

# copy the project
ADD . /spider

# install packages and build
RUN cd /spider && npm install && bower --allow-root install && gulp build

# run the app by default
EXPOSE 3000
WORKDIR /spider
CMD ["node", "."]
